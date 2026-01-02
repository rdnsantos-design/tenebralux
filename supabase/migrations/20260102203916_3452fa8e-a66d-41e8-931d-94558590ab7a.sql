-- Atualizar RPC select_maneuver_card para validar card_type = 'movimentacao'
CREATE OR REPLACE FUNCTION public.select_maneuver_card(
  p_room_id UUID,
  p_session_id TEXT,
  p_card_index INTEGER,
  p_commander_instance_id TEXT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_hand jsonb;
  v_card jsonb;
  v_board jsonb;
  v_player_key text;
  v_cmd_state jsonb;
  v_commander_cmd jsonb;
  v_card_cmd_req INTEGER;
  v_new_version INTEGER;
  v_card_type TEXT;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  -- Validar fase
  IF v_state.combat_phase != 'initiative_maneuver' THEN 
    RAISE EXCEPTION 'Não está na subfase de manobras. Fase atual: %', v_state.combat_phase; 
  END IF;
  
  -- Pegar mão e cmd_state
  IF v_player_number = 1 THEN
    v_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
    v_cmd_state := v_state.player1_cmd_state;
  ELSE
    v_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
    v_cmd_state := v_state.player2_cmd_state;
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  -- Se card_index é NULL, limpar manobra
  IF p_card_index IS NULL THEN
    v_board := jsonb_set(v_board, ARRAY[v_player_key, 'maneuver'], 'null'::jsonb);
    UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() 
    WHERE room_id = p_room_id RETURNING version INTO v_new_version;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, v_player_number, 'clear_maneuver', '{}'::jsonb, 'combat', v_new_version);
    
    RETURN jsonb_build_object('success', true, 'version', v_new_version);
  END IF;
  
  -- Validar índice
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN 
    RAISE EXCEPTION 'Índice de carta inválido'; 
  END IF;
  
  v_card := v_hand->p_card_index;
  
  -- Validar card_type = 'movimentacao' para fase de iniciativa
  v_card_type := COALESCE(v_card->>'card_type', v_card->>'effect_tag', 'ofensiva');
  IF v_card_type != 'movimentacao' THEN
    RAISE EXCEPTION 'Esta carta é do tipo "%" e não pode ser usada na fase de Iniciativa. Use cartas de "movimentacao".', v_card_type;
  END IF;
  
  -- Verificar se comandante existe
  v_commander_cmd := v_cmd_state->'commanders'->p_commander_instance_id::text;
  IF v_commander_cmd IS NULL THEN
    RAISE EXCEPTION 'Comandante não encontrado: %', p_commander_instance_id;
  END IF;
  
  -- Verificar CMD disponível do comandante
  v_card_cmd_req := COALESCE((v_card->>'command_required')::int, 1);
  IF COALESCE((v_commander_cmd->>'cmd_free')::int, 0) < v_card_cmd_req THEN
    RAISE EXCEPTION 'CMD insuficiente no comandante. Requer: %, Disponível: %', 
      v_card_cmd_req, (v_commander_cmd->>'cmd_free')::int;
  END IF;
  
  -- Salvar manobra vinculada ao comandante
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'maneuver'], jsonb_build_object(
    'card', v_card,
    'card_index', p_card_index,
    'commander_instance_id', p_commander_instance_id,
    'cmd_cost', v_card_cmd_req
  ));
  
  UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() 
  WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'select_maneuver', jsonb_build_object(
    'card_name', v_card->>'name',
    'commander_id', p_commander_instance_id,
    'cmd_cost', v_card_cmd_req
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'card', v_card);
END;
$$;

-- Atualizar RPC play_attack_maneuver para validar card_type = 'ofensiva'
CREATE OR REPLACE FUNCTION public.play_attack_maneuver(
  p_room_id UUID,
  p_session_id TEXT,
  p_card_index INTEGER,
  p_commander_instance_id TEXT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_board jsonb;
  v_new_version INTEGER;
  v_current_attacker INTEGER;
  v_pkey TEXT;
  v_hand jsonb;
  v_card jsonb;
  v_cmd_state jsonb;
  v_cmd_free INTEGER;
  v_cmd_cost INTEGER;
  v_existing_maneuvers jsonb;
  v_card_type TEXT;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'attack_maneuver' THEN 
    RAISE EXCEPTION 'Não está na subfase de manobras de ataque (atual: %)', v_state.combat_phase; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_current_attacker := (v_board->>'current_attacker')::int;
  
  IF v_player_number != v_current_attacker THEN
    RAISE EXCEPTION 'Apenas o atacante pode jogar manobras ofensivas';
  END IF;
  
  v_pkey := 'p' || v_player_number;
  
  -- Buscar mão do jogador
  v_hand := CASE WHEN v_player_number = 1 THEN v_state.player1_hand ELSE v_state.player2_hand END;
  
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN
    RAISE EXCEPTION 'Índice de carta inválido';
  END IF;
  
  v_card := v_hand->p_card_index;
  
  -- Validar card_type = 'ofensiva' para fase de ataque
  v_card_type := COALESCE(v_card->>'card_type', 'ofensiva');
  IF v_card_type != 'ofensiva' THEN
    RAISE EXCEPTION 'Esta carta é do tipo "%" e não pode ser usada na Fase de Ataque. Use cartas "ofensivas".', v_card_type;
  END IF;
  
  v_cmd_cost := COALESCE((v_card->>'command_required')::int, 1);
  
  -- Verificar CMD do comandante
  v_cmd_state := CASE WHEN v_player_number = 1 THEN v_state.player1_cmd_state ELSE v_state.player2_cmd_state END;
  v_cmd_free := COALESCE((v_cmd_state->'commanders'->p_commander_instance_id->>'cmd_free')::int, 0);
  
  IF v_cmd_free < v_cmd_cost THEN
    RAISE EXCEPTION 'CMD insuficiente no comandante (tem %, precisa %)', v_cmd_free, v_cmd_cost;
  END IF;
  
  -- Adicionar manobra à lista
  v_existing_maneuvers := COALESCE(v_board->v_pkey->'attack_maneuvers', '[]'::jsonb);
  v_existing_maneuvers := v_existing_maneuvers || jsonb_build_object(
    'card', v_card,
    'card_index', p_card_index,
    'commander_instance_id', p_commander_instance_id,
    'cmd_cost', v_cmd_cost
  );
  v_board := jsonb_set(v_board, ARRAY[v_pkey, 'attack_maneuvers'], v_existing_maneuvers);
  
  -- Descontar CMD do comandante
  v_cmd_state := jsonb_set(v_cmd_state, 
    ARRAY['commanders', p_commander_instance_id, 'cmd_free'], 
    to_jsonb(v_cmd_free - v_cmd_cost)
  );
  v_cmd_state := jsonb_set(v_cmd_state, 
    ARRAY['commanders', p_commander_instance_id, 'cmd_spent'], 
    to_jsonb(COALESCE((v_cmd_state->'commanders'->p_commander_instance_id->>'cmd_spent')::int, 0) + v_cmd_cost)
  );
  
  -- Remover carta da mão
  v_hand := v_hand - p_card_index;
  
  -- Salvar estado
  IF v_player_number = 1 THEN
    UPDATE public.match_state 
    SET combat_board_state = v_board, 
        player1_hand = v_hand,
        player1_cmd_state = v_cmd_state,
        version = version + 1, 
        updated_at = now() 
    WHERE room_id = p_room_id 
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state 
    SET combat_board_state = v_board, 
        player2_hand = v_hand,
        player2_cmd_state = v_cmd_state,
        version = version + 1, 
        updated_at = now() 
    WHERE room_id = p_room_id 
    RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'play_attack_maneuver', jsonb_build_object(
    'card_name', v_card->>'name',
    'commander_instance_id', p_commander_instance_id,
    'cmd_cost', v_cmd_cost
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'card', v_card->>'name');
END;
$$;

-- Atualizar RPC play_defense_maneuver para validar card_type = 'defensiva'
CREATE OR REPLACE FUNCTION public.play_defense_maneuver(
  p_room_id UUID,
  p_session_id TEXT,
  p_card_index INTEGER,
  p_commander_instance_id TEXT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_board jsonb;
  v_new_version INTEGER;
  v_current_defender INTEGER;
  v_pkey TEXT;
  v_hand jsonb;
  v_card jsonb;
  v_cmd_state jsonb;
  v_cmd_free INTEGER;
  v_cmd_cost INTEGER;
  v_existing_maneuvers jsonb;
  v_card_type TEXT;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'defense_maneuver' THEN 
    RAISE EXCEPTION 'Não está na subfase de manobras de defesa (atual: %)', v_state.combat_phase; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_current_defender := (v_board->>'current_defender')::int;
  
  IF v_player_number != v_current_defender THEN
    RAISE EXCEPTION 'Apenas o defensor pode jogar manobras defensivas';
  END IF;
  
  v_pkey := 'p' || v_player_number;
  
  -- Buscar mão do jogador
  v_hand := CASE WHEN v_player_number = 1 THEN v_state.player1_hand ELSE v_state.player2_hand END;
  
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN
    RAISE EXCEPTION 'Índice de carta inválido';
  END IF;
  
  v_card := v_hand->p_card_index;
  
  -- Validar card_type = 'defensiva' para fase de defesa
  v_card_type := COALESCE(v_card->>'card_type', 'ofensiva');
  IF v_card_type != 'defensiva' THEN
    RAISE EXCEPTION 'Esta carta é do tipo "%" e não pode ser usada na Fase de Defesa. Use cartas "defensivas".', v_card_type;
  END IF;
  
  v_cmd_cost := COALESCE((v_card->>'command_required')::int, 1);
  
  -- Verificar CMD do comandante
  v_cmd_state := CASE WHEN v_player_number = 1 THEN v_state.player1_cmd_state ELSE v_state.player2_cmd_state END;
  v_cmd_free := COALESCE((v_cmd_state->'commanders'->p_commander_instance_id->>'cmd_free')::int, 0);
  
  IF v_cmd_free < v_cmd_cost THEN
    RAISE EXCEPTION 'CMD insuficiente no comandante (tem %, precisa %)', v_cmd_free, v_cmd_cost;
  END IF;
  
  -- Adicionar manobra à lista
  v_existing_maneuvers := COALESCE(v_board->v_pkey->'defense_maneuvers', '[]'::jsonb);
  v_existing_maneuvers := v_existing_maneuvers || jsonb_build_object(
    'card', v_card,
    'card_index', p_card_index,
    'commander_instance_id', p_commander_instance_id,
    'cmd_cost', v_cmd_cost
  );
  v_board := jsonb_set(v_board, ARRAY[v_pkey, 'defense_maneuvers'], v_existing_maneuvers);
  
  -- Descontar CMD do comandante
  v_cmd_state := jsonb_set(v_cmd_state, 
    ARRAY['commanders', p_commander_instance_id, 'cmd_free'], 
    to_jsonb(v_cmd_free - v_cmd_cost)
  );
  v_cmd_state := jsonb_set(v_cmd_state, 
    ARRAY['commanders', p_commander_instance_id, 'cmd_spent'], 
    to_jsonb(COALESCE((v_cmd_state->'commanders'->p_commander_instance_id->>'cmd_spent')::int, 0) + v_cmd_cost)
  );
  
  -- Remover carta da mão
  v_hand := v_hand - p_card_index;
  
  -- Salvar estado
  IF v_player_number = 1 THEN
    UPDATE public.match_state 
    SET combat_board_state = v_board, 
        player1_hand = v_hand,
        player1_cmd_state = v_cmd_state,
        version = version + 1, 
        updated_at = now() 
    WHERE room_id = p_room_id 
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state 
    SET combat_board_state = v_board, 
        player2_hand = v_hand,
        player2_cmd_state = v_cmd_state,
        version = version + 1, 
        updated_at = now() 
    WHERE room_id = p_room_id 
    RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'play_defense_maneuver', jsonb_build_object(
    'card_name', v_card->>'name',
    'commander_instance_id', p_commander_instance_id,
    'cmd_cost', v_cmd_cost
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'card', v_card->>'name');
END;
$$;