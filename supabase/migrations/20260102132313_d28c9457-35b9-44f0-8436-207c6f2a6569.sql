-- ====================================================================
-- FASE COMBATE MVP - Mass Combat
-- Implementa as RPCs e lógica de combate simplificada
-- ====================================================================

-- Função helper para embaralhar array jsonb (Fisher-Yates simplificado com seed)
CREATE OR REPLACE FUNCTION public.shuffle_jsonb_array(arr jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  result jsonb := '[]'::jsonb;
  temp jsonb := arr;
  i INTEGER;
  rand_idx INTEGER;
BEGIN
  FOR i IN REVERSE (jsonb_array_length(temp) - 1)..0 LOOP
    rand_idx := floor(random() * (i + 1));
    result := result || jsonb_build_array(temp->rand_idx);
    temp := temp - rand_idx;
  END LOOP;
  RETURN result;
END;
$function$;

-- ====================================================================
-- START_COMBAT - Inicializa o combate quando ambos confirmam deck
-- ====================================================================
CREATE OR REPLACE FUNCTION public.start_combat(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_room RECORD;
  v_p1_deck jsonb;
  v_p2_deck jsonb;
  v_p1_draw_pile jsonb := '[]'::jsonb;
  v_p2_draw_pile jsonb := '[]'::jsonb;
  v_p1_hand jsonb := '[]'::jsonb;
  v_p2_hand jsonb := '[]'::jsonb;
  v_new_version INTEGER;
  v_initial_board jsonb;
  v_p1_general RECORD;
  v_p2_general RECORD;
  v_p1_cmd_state jsonb;
  v_p2_cmd_state jsonb;
  i INTEGER;
BEGIN
  -- Buscar sala e estado
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  -- Verificar se ambos confirmaram deck
  IF NOT (v_state.player1_deck_confirmed AND v_state.player2_deck_confirmed) THEN
    RAISE EXCEPTION 'Ambos jogadores precisam confirmar o deck';
  END IF;
  
  -- Montar draw piles a partir dos decks
  -- Player 1
  v_p1_deck := COALESCE(v_state.player1_deck, '{}'::jsonb);
  -- Concatenar todas as categorias do deck
  v_p1_draw_pile := COALESCE(v_p1_deck->'initiative', '[]'::jsonb) 
                 || COALESCE(v_p1_deck->'offensive', '[]'::jsonb)
                 || COALESCE(v_p1_deck->'defensive', '[]'::jsonb)
                 || COALESCE(v_p1_deck->'reactions', '[]'::jsonb);
  -- Embaralhar
  v_p1_draw_pile := public.shuffle_jsonb_array(v_p1_draw_pile);
  
  -- Player 2
  v_p2_deck := COALESCE(v_state.player2_deck, '{}'::jsonb);
  v_p2_draw_pile := COALESCE(v_p2_deck->'initiative', '[]'::jsonb) 
                 || COALESCE(v_p2_deck->'offensive', '[]'::jsonb)
                 || COALESCE(v_p2_deck->'defensive', '[]'::jsonb)
                 || COALESCE(v_p2_deck->'reactions', '[]'::jsonb);
  v_p2_draw_pile := public.shuffle_jsonb_array(v_p2_draw_pile);
  
  -- Comprar 5 cartas para cada mão
  FOR i IN 0..4 LOOP
    IF jsonb_array_length(v_p1_draw_pile) > 0 THEN
      v_p1_hand := v_p1_hand || jsonb_build_array(v_p1_draw_pile->0);
      v_p1_draw_pile := v_p1_draw_pile - 0;
    END IF;
    IF jsonb_array_length(v_p2_draw_pile) > 0 THEN
      v_p2_hand := v_p2_hand || jsonb_build_array(v_p2_draw_pile->0);
      v_p2_draw_pile := v_p2_draw_pile - 0;
    END IF;
  END LOOP;
  
  -- Buscar general de cada jogador para CMD inicial
  SELECT * INTO v_p1_general FROM public.mass_combat_commander_templates 
  WHERE id = v_state.player1_general_id;
  
  SELECT * INTO v_p2_general FROM public.mass_combat_commander_templates 
  WHERE id = v_state.player2_general_id;
  
  -- Inicializar CMD state
  v_p1_cmd_state := jsonb_build_object(
    'general', jsonb_build_object(
      'cmd_total', COALESCE(v_p1_general.comando, 3),
      'cmd_spent', 0,
      'cmd_free', COALESCE(v_p1_general.comando, 3)
    ),
    'commanders', '{}'::jsonb
  );
  
  v_p2_cmd_state := jsonb_build_object(
    'general', jsonb_build_object(
      'cmd_total', COALESCE(v_p2_general.comando, 3),
      'cmd_spent', 0,
      'cmd_free', COALESCE(v_p2_general.comando, 3)
    ),
    'commanders', '{}'::jsonb
  );
  
  -- Estrutura inicial do board
  v_initial_board := jsonb_build_object(
    'step', 'initiative',
    'draw_pile_p1', v_p1_draw_pile,
    'draw_pile_p2', v_p2_draw_pile,
    'p1', jsonb_build_object(
      'initiative_card', null,
      'main_card', null,
      'confirmed', false
    ),
    'p2', jsonb_build_object(
      'initiative_card', null,
      'main_card', null,
      'confirmed', false
    ),
    'last_resolution', null
  );
  
  -- Atualizar match_state
  UPDATE public.match_state
  SET 
    combat_phase = 'initiative',
    combat_round = 1,
    combat_board_state = v_initial_board,
    player1_hand = v_p1_hand,
    player2_hand = v_p2_hand,
    player1_discard = '[]'::jsonb,
    player2_discard = '[]'::jsonb,
    player1_cmd_state = v_p1_cmd_state,
    player2_cmd_state = v_p2_cmd_state,
    player1_hp = 100,
    player2_hp = 100,
    player1_basic_cards_state = '{"attack":false,"defense":false,"initiative":false,"heal":false,"countermaneuver":false}'::jsonb,
    player2_basic_cards_state = '{"attack":false,"defense":false,"initiative":false,"heal":false,"countermaneuver":false}'::jsonb,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Atualizar fase da sala
  UPDATE public.rooms
  SET current_phase = 'combat', updated_at = now()
  WHERE id = p_room_id;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'start_combat', jsonb_build_object(
    'p1_hand_size', jsonb_array_length(v_p1_hand),
    'p2_hand_size', jsonb_array_length(v_p2_hand),
    'p1_draw_pile_size', jsonb_array_length(v_p1_draw_pile),
    'p2_draw_pile_size', jsonb_array_length(v_p2_draw_pile)
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true,
    'version', v_new_version,
    'p1_hand_size', jsonb_array_length(v_p1_hand),
    'p2_hand_size', jsonb_array_length(v_p2_hand)
  );
END;
$function$;

-- ====================================================================
-- SELECT_INITIATIVE_CARD - Selecionar carta de iniciativa
-- ====================================================================
CREATE OR REPLACE FUNCTION public.select_initiative_card(
  p_room_id uuid,
  p_session_id text,
  p_card_index integer DEFAULT NULL -- índice na mão, null para "nenhuma"
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_board jsonb;
  v_hand jsonb;
  v_card jsonb := null;
  v_player_key text;
  v_new_version INTEGER;
BEGIN
  -- Auth
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  -- Get state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  -- Verificar fase
  IF v_state.combat_phase != 'initiative' THEN
    RAISE EXCEPTION 'Não está na fase de iniciativa';
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  -- Verificar se já confirmou
  IF (v_board->v_player_key->>'confirmed')::boolean THEN
    RAISE EXCEPTION 'Já confirmou a iniciativa';
  END IF;
  
  -- Pegar a mão do jogador
  IF v_player_number = 1 THEN
    v_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
  ELSE
    v_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
  END IF;
  
  -- Se p_card_index não é null, pegar a carta
  IF p_card_index IS NOT NULL THEN
    IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN
      RAISE EXCEPTION 'Índice de carta inválido';
    END IF;
    v_card := v_hand->p_card_index;
  END IF;
  
  -- Atualizar board state
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'initiative_card'], COALESCE(v_card, 'null'::jsonb));
  
  UPDATE public.match_state
  SET 
    combat_board_state = v_board,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Log
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'select_initiative_card', 
    jsonb_build_object('card_index', p_card_index, 'card_name', v_card->>'name'),
    'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'card', v_card);
END;
$function$;

-- ====================================================================
-- CONFIRM_INITIATIVE - Confirma seleção de iniciativa
-- ====================================================================
CREATE OR REPLACE FUNCTION public.confirm_initiative(
  p_room_id uuid,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_board jsonb;
  v_player_key text;
  v_both_confirmed BOOLEAN;
  v_new_version INTEGER;
BEGIN
  -- Auth
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  IF v_state.combat_phase != 'initiative' THEN
    RAISE EXCEPTION 'Não está na fase de iniciativa';
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  IF (v_board->v_player_key->>'confirmed')::boolean THEN
    RAISE EXCEPTION 'Já confirmou';
  END IF;
  
  -- Confirmar
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'confirmed'], 'true'::jsonb);
  
  -- Verificar se ambos confirmaram
  v_both_confirmed := ((v_board->'p1'->>'confirmed')::boolean) AND ((v_board->'p2'->>'confirmed')::boolean);
  
  IF v_both_confirmed THEN
    -- Resetar confirms e avançar para step main
    v_board := jsonb_set(v_board, ARRAY['p1', 'confirmed'], 'false'::jsonb);
    v_board := jsonb_set(v_board, ARRAY['p2', 'confirmed'], 'false'::jsonb);
    v_board := jsonb_set(v_board, ARRAY['step'], '"main"'::jsonb);
    
    UPDATE public.match_state
    SET 
      combat_board_state = v_board,
      combat_phase = 'main',
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      combat_board_state = v_board,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'confirm_initiative', 
    jsonb_build_object('both_confirmed', v_both_confirmed),
    'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'both_confirmed', v_both_confirmed, 'advanced_to_main', v_both_confirmed);
END;
$function$;

-- ====================================================================
-- SELECT_MAIN_CARD - Selecionar carta principal
-- ====================================================================
CREATE OR REPLACE FUNCTION public.select_main_card(
  p_room_id uuid,
  p_session_id text,
  p_card_index integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_board jsonb;
  v_hand jsonb;
  v_card jsonb;
  v_player_key text;
  v_new_version INTEGER;
  v_cmd_state jsonb;
  v_cmd_free INTEGER;
  v_cmd_required INTEGER;
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
  
  IF (v_board->v_player_key->>'confirmed')::boolean THEN
    RAISE EXCEPTION 'Já confirmou a carta principal';
  END IF;
  
  -- Pegar mão e CMD
  IF v_player_number = 1 THEN
    v_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
    v_cmd_state := COALESCE(v_state.player1_cmd_state, '{}'::jsonb);
  ELSE
    v_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
    v_cmd_state := COALESCE(v_state.player2_cmd_state, '{}'::jsonb);
  END IF;
  
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN
    RAISE EXCEPTION 'Índice de carta inválido';
  END IF;
  
  v_card := v_hand->p_card_index;
  
  -- Validar CMD (apenas se carta requer comando)
  v_cmd_required := COALESCE((v_card->>'command_required')::integer, 0);
  v_cmd_free := COALESCE((v_cmd_state->'general'->>'cmd_free')::integer, 0);
  
  IF v_cmd_required > v_cmd_free THEN
    RAISE EXCEPTION 'CMD insuficiente (precisa %, tem %)', v_cmd_required, v_cmd_free;
  END IF;
  
  -- Atualizar board
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'main_card'], v_card);
  
  UPDATE public.match_state
  SET 
    combat_board_state = v_board,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Log
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'select_main_card', 
    jsonb_build_object('card_index', p_card_index, 'card_name', v_card->>'name'),
    'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'card', v_card);
END;
$function$;

-- ====================================================================
-- CONFIRM_MAIN - Confirma carta principal e resolve rodada se ambos confirmaram
-- ====================================================================
CREATE OR REPLACE FUNCTION public.confirm_main(
  p_room_id uuid,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  v_p1_draw jsonb;
  v_p2_draw jsonb;
  -- Resultado
  v_resolution jsonb;
  v_initiative_winner INTEGER;
  v_combat_finished BOOLEAN := false;
  v_winner INTEGER := NULL;
  v_new_round INTEGER;
  v_card_idx INTEGER;
  i INTEGER;
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
  
  -- Mover cartas usadas para descarte
  v_p1_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
  v_p2_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
  v_p1_discard := COALESCE(v_state.player1_discard, '[]'::jsonb);
  v_p2_discard := COALESCE(v_state.player2_discard, '[]'::jsonb);
  v_p1_draw := COALESCE(v_board->'draw_pile_p1', '[]'::jsonb);
  v_p2_draw := COALESCE(v_board->'draw_pile_p2', '[]'::jsonb);
  
  -- Remover cartas usadas da mão e adicionar ao descarte (usando card_id ou id)
  IF v_p1_init_card IS NOT NULL AND v_p1_init_card::text != 'null' THEN
    v_p1_discard := v_p1_discard || jsonb_build_array(v_p1_init_card);
    -- Remover da mão pelo card_id
    v_p1_hand := (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(v_p1_hand) elem
      WHERE COALESCE(elem->>'card_id', elem->>'id') != COALESCE(v_p1_init_card->>'card_id', v_p1_init_card->>'id')
    );
  END IF;
  
  IF v_p1_main_card IS NOT NULL THEN
    v_p1_discard := v_p1_discard || jsonb_build_array(v_p1_main_card);
    v_p1_hand := (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(v_p1_hand) elem
      WHERE COALESCE(elem->>'card_id', elem->>'id') != COALESCE(v_p1_main_card->>'card_id', v_p1_main_card->>'id')
    );
  END IF;
  
  IF v_p2_init_card IS NOT NULL AND v_p2_init_card::text != 'null' THEN
    v_p2_discard := v_p2_discard || jsonb_build_array(v_p2_init_card);
    v_p2_hand := (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(v_p2_hand) elem
      WHERE COALESCE(elem->>'card_id', elem->>'id') != COALESCE(v_p2_init_card->>'card_id', v_p2_init_card->>'id')
    );
  END IF;
  
  IF v_p2_main_card IS NOT NULL THEN
    v_p2_discard := v_p2_discard || jsonb_build_array(v_p2_main_card);
    v_p2_hand := (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(v_p2_hand) elem
      WHERE COALESCE(elem->>'card_id', elem->>'id') != COALESCE(v_p2_main_card->>'card_id', v_p2_main_card->>'id')
    );
  END IF;
  
  -- Comprar cartas até 5 (se houver no draw pile)
  WHILE jsonb_array_length(v_p1_hand) < 5 AND jsonb_array_length(v_p1_draw) > 0 LOOP
    v_p1_hand := v_p1_hand || jsonb_build_array(v_p1_draw->0);
    v_p1_draw := v_p1_draw - 0;
  END LOOP;
  
  WHILE jsonb_array_length(v_p2_hand) < 5 AND jsonb_array_length(v_p2_draw) > 0 LOOP
    v_p2_hand := v_p2_hand || jsonb_build_array(v_p2_draw->0);
    v_p2_draw := v_p2_draw - 0;
  END LOOP;
  
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
  
  -- Resetar board para nova rodada
  v_board := jsonb_build_object(
    'step', 'initiative',
    'draw_pile_p1', v_p1_draw,
    'draw_pile_p2', v_p2_draw,
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
  
  -- Log resolução
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'resolve_combat_round', v_resolution, 'combat', v_new_version);
  
  -- Se terminou, atualizar sala
  IF v_combat_finished THEN
    UPDATE public.rooms
    SET current_phase = 'resolution', updated_at = now()
    WHERE id = p_room_id;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 0, 'combat_finished', jsonb_build_object('winner', v_winner), 'combat', v_new_version);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'resolution', v_resolution,
    'combat_finished', v_combat_finished,
    'winner', v_winner
  );
END;
$function$;

-- ====================================================================
-- Atualizar confirm_deckbuilding para chamar start_combat automaticamente
-- ====================================================================
CREATE OR REPLACE FUNCTION public.confirm_deckbuilding(
  p_room_id uuid,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_commanders jsonb;
  v_general_id uuid;
  v_attributes jsonb;
  v_both_confirmed BOOLEAN;
  v_new_version INTEGER;
  v_final_spent INTEGER;
  v_vet_budget INTEGER;
  v_start_result jsonb;
BEGIN
  -- Auth
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  -- Get state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Get player data
  IF v_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_general_id := v_state.player1_general_id;
    v_attributes := v_state.player1_army_attributes;
    v_vet_budget := COALESCE(v_state.player1_vet_budget, 0);
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_general_id := v_state.player2_general_id;
    v_attributes := v_state.player2_army_attributes;
    v_vet_budget := COALESCE(v_state.player2_vet_budget, 0);
  END IF;
  
  -- Validate: need at least 1 commander
  IF jsonb_array_length(v_commanders) < 1 THEN
    RAISE EXCEPTION 'Precisa ter pelo menos 1 comandante';
  END IF;
  
  -- Validate: need general defined
  IF v_general_id IS NULL THEN
    RAISE EXCEPTION 'Precisa definir um General';
  END IF;
  
  -- Confirm
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_deck_confirmed = true,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_deck_confirmed = true,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'confirm_deckbuilding', 
    jsonb_build_object('commanders_count', jsonb_array_length(v_commanders), 'general_id', v_general_id), 
    'deckbuilding', v_new_version);
  
  -- Check if both confirmed
  SELECT (player1_deck_confirmed AND player2_deck_confirmed) INTO v_both_confirmed
  FROM public.match_state
  WHERE room_id = p_room_id;
  
  -- If both confirmed, start combat
  IF v_both_confirmed THEN
    v_start_result := public.start_combat(p_room_id);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version, 
    'both_confirmed', v_both_confirmed,
    'combat_started', v_both_confirmed
  );
END;
$function$;