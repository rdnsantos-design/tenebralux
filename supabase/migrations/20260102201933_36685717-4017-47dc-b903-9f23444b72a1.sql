
-- Atualiza play_reaction_turn com TODO para validação de condição
CREATE OR REPLACE FUNCTION public.play_reaction_turn(
  p_room_id uuid, 
  p_session_id text, 
  p_card_index integer DEFAULT NULL
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
  v_new_version INTEGER;
  v_pkey TEXT;
  v_hand jsonb;
  v_card jsonb;
  v_reaction_turn INTEGER;
  v_other_player INTEGER;
  v_my_reaction_count INTEGER;
  v_my_passed BOOLEAN;
  v_other_passed BOOLEAN;
  v_is_countermaneuver BOOLEAN;
  v_cmd_cost INTEGER;
  v_general_cmd_free INTEGER;
  v_current_step TEXT;
  v_reactions_key TEXT;
  v_current_attacker INTEGER;
  v_current_defender INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  -- Verificar fase válida
  IF v_state.combat_phase NOT IN ('attack_reaction', 'defense_reaction', 'initiative_reaction') THEN 
    RAISE EXCEPTION 'Não está em subfase de reação (atual: %)', v_state.combat_phase; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_current_step := v_board->>'step';
  v_reaction_turn := (v_board->>'reaction_turn')::int;
  v_current_attacker := (v_board->>'current_attacker')::int;
  v_current_defender := (v_board->>'current_defender')::int;
  
  -- Verificar se é a vez deste jogador
  IF v_player_number != v_reaction_turn THEN
    RAISE EXCEPTION 'Não é sua vez de reagir (vez do jogador %)', v_reaction_turn;
  END IF;
  
  v_pkey := 'p' || v_player_number;
  v_other_player := CASE WHEN v_player_number = 1 THEN 2 ELSE 1 END;
  
  v_my_reaction_count := COALESCE((v_board->v_pkey->>'reaction_count')::int, 0);
  v_my_passed := COALESCE((v_board->v_pkey->>'reaction_passed')::boolean, false);
  v_other_passed := COALESCE((v_board->('p' || v_other_player)->>'reaction_passed')::boolean, false);
  
  -- Determinar qual lista de reações usar
  IF v_state.combat_phase = 'attack_reaction' THEN
    v_reactions_key := 'attack_reactions_this_round';
  ELSIF v_state.combat_phase = 'defense_reaction' THEN
    v_reactions_key := 'defense_reactions_this_round';
  ELSE
    v_reactions_key := 'initiative_reactions';
  END IF;
  
  -- Se p_card_index é NULL, jogador está passando
  IF p_card_index IS NULL THEN
    v_board := jsonb_set(v_board, ARRAY[v_pkey, 'reaction_passed'], 'true'::jsonb);
    
    -- Se outro já passou, ambos passaram
    IF v_other_passed THEN
      v_board := jsonb_set(v_board, ARRAY['both_passed_reaction'], 'true'::jsonb);
      
      -- Avançar para próxima subfase
      IF v_state.combat_phase = 'attack_reaction' THEN
        v_board := jsonb_set(v_board, ARRAY['step'], '"defense_maneuver"'::jsonb);
        -- Reset contadores para próxima subfase de reação
        v_board := jsonb_set(v_board, ARRAY['p1', 'reaction_count'], '0'::jsonb);
        v_board := jsonb_set(v_board, ARRAY['p1', 'reaction_passed'], 'false'::jsonb);
        v_board := jsonb_set(v_board, ARRAY['p2', 'reaction_count'], '0'::jsonb);
        v_board := jsonb_set(v_board, ARRAY['p2', 'reaction_passed'], 'false'::jsonb);
        v_board := jsonb_set(v_board, ARRAY['both_passed_reaction'], 'false'::jsonb);
        
        UPDATE public.match_state 
        SET combat_board_state = v_board, 
            combat_phase = 'defense_maneuver',
            version = version + 1, 
            updated_at = now() 
        WHERE room_id = p_room_id 
        RETURNING version INTO v_new_version;
      ELSIF v_state.combat_phase = 'defense_reaction' THEN
        v_board := jsonb_set(v_board, ARRAY['step'], '"combat_roll"'::jsonb);
        
        UPDATE public.match_state 
        SET combat_board_state = v_board, 
            combat_phase = 'combat_roll',
            version = version + 1, 
            updated_at = now() 
        WHERE room_id = p_room_id 
        RETURNING version INTO v_new_version;
      ELSE
        -- initiative_reaction -> avança conforme lógica existente
        UPDATE public.match_state 
        SET combat_board_state = v_board, 
            version = version + 1, 
            updated_at = now() 
        WHERE room_id = p_room_id 
        RETURNING version INTO v_new_version;
      END IF;
    ELSE
      -- Passar vez para outro jogador
      v_board := jsonb_set(v_board, ARRAY['reaction_turn'], to_jsonb(v_other_player));
      
      UPDATE public.match_state 
      SET combat_board_state = v_board, 
          version = version + 1, 
          updated_at = now() 
      WHERE room_id = p_room_id 
      RETURNING version INTO v_new_version;
    END IF;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, v_player_number, 'reaction_pass', jsonb_build_object(
      'step', v_current_step,
      'both_passed', v_other_passed
    ), 'combat', v_new_version);
    
    RETURN jsonb_build_object('success', true, 'action', 'pass', 'version', v_new_version);
  END IF;
  
  -- Jogador está jogando uma carta de reação
  IF v_player_number = 1 THEN
    v_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
  ELSE
    v_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
  END IF;
  
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN
    RAISE EXCEPTION 'Índice de carta inválido';
  END IF;
  
  v_card := v_hand->p_card_index;
  
  -- Verificar se é contra-manobra (ignora limite)
  v_is_countermaneuver := COALESCE(v_card->>'effect_tag', '') = 'countermaneuver';
  
  -- Verificar limite de 2 reações (exceto contra-manobra)
  IF NOT v_is_countermaneuver AND v_my_reaction_count >= 2 THEN
    RAISE EXCEPTION 'Limite de 2 reações por subfase atingido';
  END IF;
  
  -- TODO: VALIDAR CONDIÇÃO DA CARTA DE REAÇÃO
  -- Cada carta tem major_condition/minor_condition que define quando pode ser jogada
  -- Ex: "só pode jogar se inimigo jogou manobra ofensiva"
  -- Por enquanto, qualquer carta com CMD disponível é aceita
  -- Logar condição para debug:
  -- v_card->>'major_condition', v_card->>'minor_condition', v_card->>'effect_tag'
  
  -- Reações consomem CMD do general
  v_cmd_cost := COALESCE((v_card->>'command_required')::int, 1);
  
  IF v_player_number = 1 THEN
    v_general_cmd_free := COALESCE((v_state.player1_cmd_state->'general'->>'cmd_free')::int, 0);
  ELSE
    v_general_cmd_free := COALESCE((v_state.player2_cmd_state->'general'->>'cmd_free')::int, 0);
  END IF;
  
  IF v_general_cmd_free < v_cmd_cost THEN
    RAISE EXCEPTION 'CMD insuficiente no general (precisa %, tem %)', v_cmd_cost, v_general_cmd_free;
  END IF;
  
  -- Consumir CMD do general
  IF v_player_number = 1 THEN
    UPDATE public.match_state 
    SET player1_cmd_state = jsonb_set(
      player1_cmd_state, 
      ARRAY['general', 'cmd_free'], 
      to_jsonb(v_general_cmd_free - v_cmd_cost)
    ),
    player1_cmd_state = jsonb_set(
      player1_cmd_state, 
      ARRAY['general', 'cmd_spent'], 
      to_jsonb(COALESCE((player1_cmd_state->'general'->>'cmd_spent')::int, 0) + v_cmd_cost)
    )
    WHERE room_id = p_room_id;
  ELSE
    UPDATE public.match_state 
    SET player2_cmd_state = jsonb_set(
      player2_cmd_state, 
      ARRAY['general', 'cmd_free'], 
      to_jsonb(v_general_cmd_free - v_cmd_cost)
    ),
    player2_cmd_state = jsonb_set(
      player2_cmd_state, 
      ARRAY['general', 'cmd_spent'], 
      to_jsonb(COALESCE((player2_cmd_state->'general'->>'cmd_spent')::int, 0) + v_cmd_cost)
    )
    WHERE room_id = p_room_id;
  END IF;
  
  -- Adicionar carta à lista de reações desta fase
  v_board := jsonb_set(
    v_board, 
    ARRAY[v_reactions_key], 
    COALESCE(v_board->v_reactions_key, '[]'::jsonb) || jsonb_build_object(
      'player', v_player_number,
      'card', v_card,
      'is_countermaneuver', v_is_countermaneuver
    )
  );
  
  -- Incrementar contador (se não for contra-manobra)
  IF NOT v_is_countermaneuver THEN
    v_board := jsonb_set(v_board, ARRAY[v_pkey, 'reaction_count'], to_jsonb(v_my_reaction_count + 1));
  END IF;
  
  -- Remover carta da mão
  IF v_player_number = 1 THEN
    v_hand := v_hand - p_card_index;
    UPDATE public.match_state SET player1_hand = v_hand WHERE room_id = p_room_id;
  ELSE
    v_hand := v_hand - p_card_index;
    UPDATE public.match_state SET player2_hand = v_hand WHERE room_id = p_room_id;
  END IF;
  
  -- Resetar passed do jogador atual (ele jogou, não passou)
  v_board := jsonb_set(v_board, ARRAY[v_pkey, 'reaction_passed'], 'false'::jsonb);
  -- Resetar passed do outro (precisa responder de novo)
  v_board := jsonb_set(v_board, ARRAY['p' || v_other_player, 'reaction_passed'], 'false'::jsonb);
  
  -- Passar vez para outro jogador
  v_board := jsonb_set(v_board, ARRAY['reaction_turn'], to_jsonb(v_other_player));
  
  UPDATE public.match_state 
  SET combat_board_state = v_board, 
      version = version + 1, 
      updated_at = now() 
  WHERE room_id = p_room_id 
  RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'play_reaction', jsonb_build_object(
    'card_name', v_card->>'name',
    'card_id', v_card->>'id',
    'is_countermaneuver', v_is_countermaneuver,
    'cmd_cost', v_cmd_cost,
    'step', v_current_step,
    'condition_major', v_card->>'major_condition',
    'condition_minor', v_card->>'minor_condition',
    'effect_tag', v_card->>'effect_tag'
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'action', 'play_reaction', 
    'card_name', v_card->>'name',
    'version', v_new_version
  );
END;
$function$;
