
-- Recriar confirm_main com lógica correta:
-- - Apenas cartas de reação são descartadas
-- - Cartas de manobra/básicas permanecem na mão
-- - Sem compra de cartas (deck building já define a mão completa)

CREATE OR REPLACE FUNCTION public.confirm_main(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_board jsonb;
  v_player_key text;
  v_both_confirmed BOOLEAN;
  v_new_version INTEGER;
  -- Cartas selecionadas
  v_p1_init_card jsonb;
  v_p1_main_card jsonb;
  v_p2_init_card jsonb;
  v_p2_main_card jsonb;
  -- Atributos base
  v_p1_atk INTEGER;
  v_p1_def INTEGER;
  v_p1_mob INTEGER;
  v_p2_atk INTEGER;
  v_p2_def INTEGER;
  v_p2_mob INTEGER;
  -- Bônus
  v_p1_atk_bonus INTEGER := 0;
  v_p1_def_bonus INTEGER := 0;
  v_p1_mob_bonus INTEGER := 0;
  v_p2_atk_bonus INTEGER := 0;
  v_p2_def_bonus INTEGER := 0;
  v_p2_mob_bonus INTEGER := 0;
  -- Finais
  v_p1_atk_final INTEGER;
  v_p1_def_final INTEGER;
  v_p1_mob_final INTEGER;
  v_p2_atk_final INTEGER;
  v_p2_def_final INTEGER;
  v_p2_mob_final INTEGER;
  -- Danos
  v_damage_to_p1 INTEGER;
  v_damage_to_p2 INTEGER;
  v_p1_hp_new INTEGER;
  v_p2_hp_new INTEGER;
  -- Mãos e descartes
  v_p1_hand jsonb;
  v_p2_hand jsonb;
  v_p1_discard jsonb;
  v_p2_discard jsonb;
  -- Resultado
  v_resolution jsonb;
  v_initiative_winner INTEGER;
  v_combat_finished BOOLEAN := false;
  v_winner INTEGER := NULL;
  v_new_round INTEGER;
  -- Para verificar tipo de carta
  v_card_unit_type text;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  IF v_state.combat_phase != 'main' THEN
    RAISE EXCEPTION 'Não está na fase principal';
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  -- Verificar se tem carta selecionada
  IF v_board->v_player_key->'main_card' IS NULL OR v_board->v_player_key->>'main_card' = 'null' THEN
    RAISE EXCEPTION 'Precisa selecionar uma carta principal';
  END IF;
  
  IF (v_board->v_player_key->>'confirmed')::boolean THEN
    RAISE EXCEPTION 'Já confirmou';
  END IF;
  
  -- Confirmar
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'confirmed'], 'true'::jsonb);
  
  -- Verificar se ambos confirmaram
  v_both_confirmed := ((v_board->'p1'->>'confirmed')::boolean) AND ((v_board->'p2'->>'confirmed')::boolean);
  
  IF NOT v_both_confirmed THEN
    -- Aguardar outro jogador
    UPDATE public.match_state
    SET 
      combat_board_state = v_board,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, v_player_number, 'confirm_main', 
      jsonb_build_object('waiting_opponent', true),
      'combat', v_new_version);
    
    RETURN jsonb_build_object('success', true, 'version', v_new_version, 'waiting_opponent', true);
  END IF;
  
  -- ===== RESOLVER COMBATE =====
  
  -- Pegar cartas do board
  v_p1_init_card := v_board->'p1'->'initiative_card';
  v_p1_main_card := v_board->'p1'->'main_card';
  v_p2_init_card := v_board->'p2'->'initiative_card';
  v_p2_main_card := v_board->'p2'->'main_card';
  
  -- Atributos base dos exércitos
  v_p1_atk := COALESCE((v_state.player1_army_attributes->>'attack')::integer, 0);
  v_p1_def := COALESCE((v_state.player1_army_attributes->>'defense')::integer, 0);
  v_p1_mob := COALESCE((v_state.player1_army_attributes->>'mobility')::integer, 0);
  
  v_p2_atk := COALESCE((v_state.player2_army_attributes->>'attack')::integer, 0);
  v_p2_def := COALESCE((v_state.player2_army_attributes->>'defense')::integer, 0);
  v_p2_mob := COALESCE((v_state.player2_army_attributes->>'mobility')::integer, 0);
  
  -- Somar bônus das cartas (initiative + main)
  IF v_p1_init_card IS NOT NULL AND v_p1_init_card::text != 'null' THEN
    v_p1_atk_bonus := v_p1_atk_bonus + COALESCE((v_p1_init_card->>'attack_bonus')::integer, 0);
    v_p1_def_bonus := v_p1_def_bonus + COALESCE((v_p1_init_card->>'defense_bonus')::integer, 0);
    v_p1_mob_bonus := v_p1_mob_bonus + COALESCE((v_p1_init_card->>'mobility_bonus')::integer, 0);
  END IF;
  
  IF v_p1_main_card IS NOT NULL THEN
    v_p1_atk_bonus := v_p1_atk_bonus + COALESCE((v_p1_main_card->>'attack_bonus')::integer, 0);
    v_p1_def_bonus := v_p1_def_bonus + COALESCE((v_p1_main_card->>'defense_bonus')::integer, 0);
    v_p1_mob_bonus := v_p1_mob_bonus + COALESCE((v_p1_main_card->>'mobility_bonus')::integer, 0);
  END IF;
  
  IF v_p2_init_card IS NOT NULL AND v_p2_init_card::text != 'null' THEN
    v_p2_atk_bonus := v_p2_atk_bonus + COALESCE((v_p2_init_card->>'attack_bonus')::integer, 0);
    v_p2_def_bonus := v_p2_def_bonus + COALESCE((v_p2_init_card->>'defense_bonus')::integer, 0);
    v_p2_mob_bonus := v_p2_mob_bonus + COALESCE((v_p2_init_card->>'mobility_bonus')::integer, 0);
  END IF;
  
  IF v_p2_main_card IS NOT NULL THEN
    v_p2_atk_bonus := v_p2_atk_bonus + COALESCE((v_p2_main_card->>'attack_bonus')::integer, 0);
    v_p2_def_bonus := v_p2_def_bonus + COALESCE((v_p2_main_card->>'defense_bonus')::integer, 0);
    v_p2_mob_bonus := v_p2_mob_bonus + COALESCE((v_p2_main_card->>'mobility_bonus')::integer, 0);
  END IF;
  
  -- Calcular finais
  v_p1_atk_final := v_p1_atk + v_p1_atk_bonus;
  v_p1_def_final := v_p1_def + v_p1_def_bonus;
  v_p1_mob_final := v_p1_mob + v_p1_mob_bonus;
  
  v_p2_atk_final := v_p2_atk + v_p2_atk_bonus;
  v_p2_def_final := v_p2_def + v_p2_def_bonus;
  v_p2_mob_final := v_p2_mob + v_p2_mob_bonus;
  
  -- Determinar iniciativa (maior mobility ganha)
  IF v_p1_mob_final > v_p2_mob_final THEN
    v_initiative_winner := 1;
  ELSIF v_p2_mob_final > v_p1_mob_final THEN
    v_initiative_winner := 2;
  ELSE
    v_initiative_winner := 0; -- empate
  END IF;
  
  -- Calcular danos
  v_damage_to_p2 := GREATEST(0, v_p1_atk_final - v_p2_def_final);
  v_damage_to_p1 := GREATEST(0, v_p2_atk_final - v_p1_def_final);
  
  -- Aplicar danos
  v_p1_hp_new := GREATEST(0, v_state.player1_hp - v_damage_to_p1);
  v_p2_hp_new := GREATEST(0, v_state.player2_hp - v_damage_to_p2);
  
  -- Verificar fim do combate
  IF v_p1_hp_new <= 0 AND v_p2_hp_new <= 0 THEN
    v_combat_finished := true;
    v_winner := 0; -- empate
  ELSIF v_p1_hp_new <= 0 THEN
    v_combat_finished := true;
    v_winner := 2;
  ELSIF v_p2_hp_new <= 0 THEN
    v_combat_finished := true;
    v_winner := 1;
  END IF;
  
  -- Carregar mãos e descartes
  v_p1_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
  v_p2_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
  v_p1_discard := COALESCE(v_state.player1_discard, '[]'::jsonb);
  v_p2_discard := COALESCE(v_state.player2_discard, '[]'::jsonb);
  
  -- ===== NOVA LÓGICA: Apenas cartas de REAÇÃO são descartadas =====
  -- Cartas de manobra/básicas permanecem na mão
  
  -- P1 initiative card: só descarta se for reação
  IF v_p1_init_card IS NOT NULL AND v_p1_init_card::text != 'null' THEN
    v_card_unit_type := COALESCE(v_p1_init_card->>'unit_type', '');
    IF v_card_unit_type = 'reaction' OR v_card_unit_type = 'Reaction' THEN
      v_p1_discard := v_p1_discard || jsonb_build_array(v_p1_init_card);
      v_p1_hand := (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(v_p1_hand) elem
        WHERE COALESCE(elem->>'card_id', elem->>'id') != COALESCE(v_p1_init_card->>'card_id', v_p1_init_card->>'id')
      );
    END IF;
  END IF;
  
  -- P1 main card: só descarta se for reação
  IF v_p1_main_card IS NOT NULL THEN
    v_card_unit_type := COALESCE(v_p1_main_card->>'unit_type', '');
    IF v_card_unit_type = 'reaction' OR v_card_unit_type = 'Reaction' THEN
      v_p1_discard := v_p1_discard || jsonb_build_array(v_p1_main_card);
      v_p1_hand := (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(v_p1_hand) elem
        WHERE COALESCE(elem->>'card_id', elem->>'id') != COALESCE(v_p1_main_card->>'card_id', v_p1_main_card->>'id')
      );
    END IF;
  END IF;
  
  -- P2 initiative card: só descarta se for reação
  IF v_p2_init_card IS NOT NULL AND v_p2_init_card::text != 'null' THEN
    v_card_unit_type := COALESCE(v_p2_init_card->>'unit_type', '');
    IF v_card_unit_type = 'reaction' OR v_card_unit_type = 'Reaction' THEN
      v_p2_discard := v_p2_discard || jsonb_build_array(v_p2_init_card);
      v_p2_hand := (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(v_p2_hand) elem
        WHERE COALESCE(elem->>'card_id', elem->>'id') != COALESCE(v_p2_init_card->>'card_id', v_p2_init_card->>'id')
      );
    END IF;
  END IF;
  
  -- P2 main card: só descarta se for reação
  IF v_p2_main_card IS NOT NULL THEN
    v_card_unit_type := COALESCE(v_p2_main_card->>'unit_type', '');
    IF v_card_unit_type = 'reaction' OR v_card_unit_type = 'Reaction' THEN
      v_p2_discard := v_p2_discard || jsonb_build_array(v_p2_main_card);
      v_p2_hand := (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(v_p2_hand) elem
        WHERE COALESCE(elem->>'card_id', elem->>'id') != COALESCE(v_p2_main_card->>'card_id', v_p2_main_card->>'id')
      );
    END IF;
  END IF;
  
  -- NÃO há compra de cartas - todas as cartas do deckbuilding ficam disponíveis
  
  -- Montar resolução
  v_resolution := jsonb_build_object(
    'round', v_state.combat_round,
    'p1', jsonb_build_object(
      'atk_base', v_p1_atk, 'def_base', v_p1_def, 'mob_base', v_p1_mob,
      'atk_bonus', v_p1_atk_bonus, 'def_bonus', v_p1_def_bonus, 'mob_bonus', v_p1_mob_bonus,
      'atk_final', v_p1_atk_final, 'def_final', v_p1_def_final, 'mob_final', v_p1_mob_final,
      'damage_taken', v_damage_to_p1,
      'init_card', v_p1_init_card,
      'main_card', v_p1_main_card
    ),
    'p2', jsonb_build_object(
      'atk_base', v_p2_atk, 'def_base', v_p2_def, 'mob_base', v_p2_mob,
      'atk_bonus', v_p2_atk_bonus, 'def_bonus', v_p2_def_bonus, 'mob_bonus', v_p2_mob_bonus,
      'atk_final', v_p2_atk_final, 'def_final', v_p2_def_final, 'mob_final', v_p2_mob_final,
      'damage_taken', v_damage_to_p2,
      'init_card', v_p2_init_card,
      'main_card', v_p2_main_card
    ),
    'initiative_winner', v_initiative_winner,
    'combat_finished', v_combat_finished,
    'winner', v_winner
  );
  
  -- Preparar próxima rodada
  v_new_round := v_state.combat_round + 1;
  
  -- Resetar board para nova rodada (sem draw_pile pois não há compra)
  v_board := jsonb_build_object(
    'step', 'initiative',
    'p1', jsonb_build_object('initiative_card', null, 'main_card', null, 'confirmed', false),
    'p2', jsonb_build_object('initiative_card', null, 'main_card', null, 'confirmed', false),
    'last_resolution', v_resolution
  );
  
  -- Atualizar match_state
  UPDATE public.match_state
  SET 
    combat_board_state = v_board,
    combat_phase = CASE WHEN v_combat_finished THEN 'finished' ELSE 'initiative' END,
    combat_round = CASE WHEN v_combat_finished THEN v_state.combat_round ELSE v_new_round END,
    player1_hand = v_p1_hand,
    player2_hand = v_p2_hand,
    player1_discard = v_p1_discard,
    player2_discard = v_p2_discard,
    player1_hp = v_p1_hp_new,
    player2_hp = v_p2_hp_new,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Log
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'round_resolved', v_resolution, 'combat', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version, 
    'resolution', v_resolution,
    'combat_finished', v_combat_finished,
    'winner', v_winner
  );
END;
$$;
