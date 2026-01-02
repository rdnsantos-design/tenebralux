-- ============================================================================
-- FASE 2: COMBATE - Subfases completas
-- ============================================================================

-- Atualizar o tipo de game_phase para incluir as subfases do combate
-- (PostgreSQL exige recriar o enum; vamos usar TEXT para flexibilidade)

-- ============================================================================
-- 1) RPC: choose_secondary_terrain - CORRIGIDA com validação de compatibilidade
-- ============================================================================
CREATE OR REPLACE FUNCTION public.choose_secondary_terrain(
  p_room_id uuid,
  p_session_id text,
  p_secondary_terrain_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_winner INTEGER;
  v_board jsonb;
  v_new_version INTEGER;
  v_terrain_valid BOOLEAN;
  v_terrain_mods RECORD;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'initiative_post' THEN 
    RAISE EXCEPTION 'Não está na fase pós-iniciativa'; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_winner := COALESCE((v_board->'initiative_result'->>'winner_player_number')::int, 1);
  
  IF v_player_number != v_winner THEN
    RAISE EXCEPTION 'Apenas o vencedor da iniciativa pode escolher o terreno secundário';
  END IF;
  
  -- VALIDAR compatibilidade com terreno primário
  SELECT EXISTS(
    SELECT 1 FROM mass_combat_terrain_compatibility tc
    WHERE tc.primary_terrain_id = v_state.chosen_terrain_id
      AND tc.secondary_terrain_id = p_secondary_terrain_id
  ) INTO v_terrain_valid;
  
  IF NOT v_terrain_valid THEN
    RAISE EXCEPTION 'Terreno secundário não é compatível com o terreno primário escolhido';
  END IF;
  
  -- Buscar modificadores do terreno secundário
  SELECT attack_mod, defense_mod, mobility_mod 
  INTO v_terrain_mods 
  FROM mass_combat_secondary_terrains 
  WHERE id = p_secondary_terrain_id;
  
  -- Salvar escolha + modificadores (apenas para o winner)
  v_board := jsonb_set(v_board, ARRAY['secondary_terrain_id'], to_jsonb(p_secondary_terrain_id::text));
  v_board := jsonb_set(v_board, ARRAY['secondary_terrain_mods'], jsonb_build_object(
    'attack', COALESCE(v_terrain_mods.attack_mod, 0),
    'defense', COALESCE(v_terrain_mods.defense_mod, 0),
    'mobility', COALESCE(v_terrain_mods.mobility_mod, 0)
  ));
  v_board := jsonb_set(v_board, ARRAY['initiative_winner_player_number'], to_jsonb(v_winner));
  v_board := jsonb_set(v_board, ARRAY['step'], '"initiative_post"'::jsonb);
  
  UPDATE public.match_state 
  SET 
    combat_board_state = v_board, 
    chosen_secondary_terrain_id = p_secondary_terrain_id,
    version = version + 1, 
    updated_at = now() 
  WHERE room_id = p_room_id 
  RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'choose_secondary_terrain', jsonb_build_object(
    'terrain_id', p_secondary_terrain_id,
    'mods', jsonb_build_object(
      'attack', COALESCE(v_terrain_mods.attack_mod, 0),
      'defense', COALESCE(v_terrain_mods.defense_mod, 0),
      'mobility', COALESCE(v_terrain_mods.mobility_mod, 0)
    )
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version);
END;
$function$;

-- ============================================================================
-- 2) RPC: choose_first_attacker - CORRIGIDA para inicializar Fase 2
-- ============================================================================
CREATE OR REPLACE FUNCTION public.choose_first_attacker(
  p_room_id uuid,
  p_session_id text,
  p_attacker_player_number integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_winner INTEGER;
  v_board jsonb;
  v_new_version INTEGER;
  v_defender INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'initiative_post' THEN 
    RAISE EXCEPTION 'Não está na fase pós-iniciativa'; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_winner := COALESCE((v_board->'initiative_result'->>'winner_player_number')::int, 1);
  
  IF v_player_number != v_winner THEN
    RAISE EXCEPTION 'Apenas o vencedor da iniciativa pode escolher quem ataca primeiro';
  END IF;
  
  IF p_attacker_player_number NOT IN (1, 2) THEN
    RAISE EXCEPTION 'Jogador inválido';
  END IF;
  
  IF v_state.chosen_secondary_terrain_id IS NULL THEN
    RAISE EXCEPTION 'Escolha o terreno secundário primeiro';
  END IF;
  
  -- Definir atacante/defensor
  v_defender := CASE WHEN p_attacker_player_number = 1 THEN 2 ELSE 1 END;
  
  -- Inicializar estrutura da Fase 2
  v_board := jsonb_set(v_board, ARRAY['first_attacker_player_number'], to_jsonb(p_attacker_player_number));
  v_board := jsonb_set(v_board, ARRAY['current_attacker'], to_jsonb(p_attacker_player_number));
  v_board := jsonb_set(v_board, ARRAY['current_defender'], to_jsonb(v_defender));
  v_board := jsonb_set(v_board, ARRAY['step'], '"attack_maneuver"'::jsonb);
  
  -- Inicializar estruturas de manobras para p1 e p2
  v_board := jsonb_set(v_board, ARRAY['p1', 'attack_maneuvers'], '[]'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p1', 'defense_maneuvers'], '[]'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p1', 'attack_maneuvers_confirmed'], 'false'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p1', 'defense_maneuvers_confirmed'], 'false'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p1', 'reaction_count'], '0'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p1', 'reaction_passed'], 'false'::jsonb);
  
  v_board := jsonb_set(v_board, ARRAY['p2', 'attack_maneuvers'], '[]'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p2', 'defense_maneuvers'], '[]'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p2', 'attack_maneuvers_confirmed'], 'false'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p2', 'defense_maneuvers_confirmed'], 'false'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p2', 'reaction_count'], '0'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p2', 'reaction_passed'], 'false'::jsonb);
  
  -- Reações alternadas
  v_board := jsonb_set(v_board, ARRAY['reaction_turn'], to_jsonb(v_defender)); -- defensor começa
  v_board := jsonb_set(v_board, ARRAY['reactions_this_phase'], '[]'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['both_passed_reaction'], 'false'::jsonb);
  
  UPDATE public.match_state 
  SET 
    combat_board_state = v_board, 
    first_attacker_player_number = p_attacker_player_number,
    combat_phase = 'attack_maneuver',  -- Subfase específica
    version = version + 1, 
    updated_at = now() 
  WHERE room_id = p_room_id 
  RETURNING version INTO v_new_version;
  
  -- Atualizar fase da sala
  UPDATE public.rooms 
  SET current_phase = 'combat', updated_at = now()
  WHERE id = p_room_id;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'choose_first_attacker', jsonb_build_object(
    'first_attacker', p_attacker_player_number,
    'first_defender', v_defender
  ), 'combat', v_new_version);
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'phase2_start', jsonb_build_object(
    'step', 'attack_maneuver',
    'attacker', p_attacker_player_number,
    'defender', v_defender
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'step', 'attack_maneuver');
END;
$function$;

-- ============================================================================
-- 3) RPC: play_attack_maneuver - Atacante baixa manobra ofensiva
-- ============================================================================
CREATE OR REPLACE FUNCTION public.play_attack_maneuver(
  p_room_id uuid,
  p_session_id text,
  p_card_index integer,
  p_commander_instance_id text
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
  v_current_attacker INTEGER;
  v_pkey TEXT;
  v_hand jsonb;
  v_card jsonb;
  v_cmd_state jsonb;
  v_cmd_free INTEGER;
  v_cmd_cost INTEGER;
  v_existing_maneuvers jsonb;
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
$function$;

-- ============================================================================
-- 4) RPC: confirm_attack_maneuvers - Atacante confirma e avança para reações
-- ============================================================================
CREATE OR REPLACE FUNCTION public.confirm_attack_maneuvers(
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
  v_new_version INTEGER;
  v_current_attacker INTEGER;
  v_current_defender INTEGER;
  v_pkey TEXT;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'attack_maneuver' THEN 
    RAISE EXCEPTION 'Não está na subfase de manobras de ataque'; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_current_attacker := (v_board->>'current_attacker')::int;
  v_current_defender := (v_board->>'current_defender')::int;
  
  IF v_player_number != v_current_attacker THEN
    RAISE EXCEPTION 'Apenas o atacante pode confirmar manobras de ataque';
  END IF;
  
  v_pkey := 'p' || v_player_number;
  
  -- Marcar como confirmado
  v_board := jsonb_set(v_board, ARRAY[v_pkey, 'attack_maneuvers_confirmed'], 'true'::jsonb);
  
  -- Avançar para reações (defensor começa)
  v_board := jsonb_set(v_board, ARRAY['step'], '"attack_reaction"'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['reaction_turn'], to_jsonb(v_current_defender));
  v_board := jsonb_set(v_board, ARRAY['reactions_this_phase'], '[]'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['both_passed_reaction'], 'false'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p1', 'reaction_count'], '0'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p1', 'reaction_passed'], 'false'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p2', 'reaction_count'], '0'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p2', 'reaction_passed'], 'false'::jsonb);
  
  UPDATE public.match_state 
  SET combat_board_state = v_board, 
      combat_phase = 'attack_reaction',
      version = version + 1, 
      updated_at = now() 
  WHERE room_id = p_room_id 
  RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'confirm_attack_maneuvers', jsonb_build_object(
    'maneuver_count', jsonb_array_length(COALESCE(v_board->v_pkey->'attack_maneuvers', '[]'::jsonb))
  ), 'combat', v_new_version);
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'step_advance', jsonb_build_object(
    'new_step', 'attack_reaction',
    'reaction_turn', v_current_defender
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'step', 'attack_reaction');
END;
$function$;

-- ============================================================================
-- 5) RPC: play_reaction_turn - Reação alternada (CMD do general)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.play_reaction_turn(
  p_room_id uuid,
  p_session_id text,
  p_card_index integer DEFAULT NULL  -- NULL = passar
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
  v_reaction_turn INTEGER;
  v_pkey TEXT;
  v_opponent_key TEXT;
  v_hand jsonb;
  v_card jsonb;
  v_cmd_state jsonb;
  v_general_cmd_free INTEGER;
  v_cmd_cost INTEGER;
  v_reaction_count INTEGER;
  v_is_countermaneuver BOOLEAN;
  v_reactions_this_phase jsonb;
  v_opponent_passed BOOLEAN;
  v_current_phase TEXT;
  v_next_step TEXT;
  v_current_attacker INTEGER;
  v_current_defender INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  v_current_phase := v_state.combat_phase;
  IF v_current_phase NOT IN ('attack_reaction', 'defense_reaction') THEN 
    RAISE EXCEPTION 'Não está em subfase de reação (atual: %)', v_current_phase; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_reaction_turn := (v_board->>'reaction_turn')::int;
  
  IF v_player_number != v_reaction_turn THEN
    RAISE EXCEPTION 'Não é sua vez de reagir (vez do jogador %)', v_reaction_turn;
  END IF;
  
  v_pkey := 'p' || v_player_number;
  v_opponent_key := CASE WHEN v_player_number = 1 THEN 'p2' ELSE 'p1' END;
  v_current_attacker := (v_board->>'current_attacker')::int;
  v_current_defender := (v_board->>'current_defender')::int;
  
  v_reaction_count := COALESCE((v_board->v_pkey->>'reaction_count')::int, 0);
  v_reactions_this_phase := COALESCE(v_board->'reactions_this_phase', '[]'::jsonb);
  
  IF p_card_index IS NULL THEN
    -- PASSAR
    v_board := jsonb_set(v_board, ARRAY[v_pkey, 'reaction_passed'], 'true'::jsonb);
    v_opponent_passed := COALESCE((v_board->v_opponent_key->>'reaction_passed')::boolean, false);
    
    IF v_opponent_passed THEN
      -- Ambos passaram: avançar para próxima subfase
      v_board := jsonb_set(v_board, ARRAY['both_passed_reaction'], 'true'::jsonb);
      
      IF v_current_phase = 'attack_reaction' THEN
        v_next_step := 'defense_maneuver';
      ELSE
        v_next_step := 'combat_roll';
      END IF;
      
      v_board := jsonb_set(v_board, ARRAY['step'], to_jsonb(v_next_step));
      
      UPDATE public.match_state 
      SET combat_board_state = v_board, 
          combat_phase = v_next_step,
          version = version + 1, 
          updated_at = now() 
      WHERE room_id = p_room_id 
      RETURNING version INTO v_new_version;
      
      INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
      VALUES (p_room_id, v_player_number, 'reaction_pass', jsonb_build_object(
        'both_passed', true,
        'advance_to', v_next_step
      ), 'combat', v_new_version);
      
      RETURN jsonb_build_object('success', true, 'version', v_new_version, 'passed', true, 'advance_to', v_next_step);
    ELSE
      -- Só eu passei: próxima vez é do oponente
      v_board := jsonb_set(v_board, ARRAY['reaction_turn'], to_jsonb(CASE WHEN v_player_number = 1 THEN 2 ELSE 1 END));
      
      UPDATE public.match_state 
      SET combat_board_state = v_board, 
          version = version + 1, 
          updated_at = now() 
      WHERE room_id = p_room_id 
      RETURNING version INTO v_new_version;
      
      INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
      VALUES (p_room_id, v_player_number, 'reaction_pass', jsonb_build_object('both_passed', false), 'combat', v_new_version);
      
      RETURN jsonb_build_object('success', true, 'version', v_new_version, 'passed', true);
    END IF;
  ELSE
    -- JOGAR REAÇÃO
    v_hand := CASE WHEN v_player_number = 1 THEN v_state.player1_hand ELSE v_state.player2_hand END;
    
    IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN
      RAISE EXCEPTION 'Índice de carta inválido';
    END IF;
    
    v_card := v_hand->p_card_index;
    v_cmd_cost := COALESCE((v_card->>'command_required')::int, 1);
    v_is_countermaneuver := COALESCE(v_card->>'effect_tag', '') = 'contra_manobra';
    
    -- Verificar limite de 2 reações (exceto contra-manobra)
    IF NOT v_is_countermaneuver AND v_reaction_count >= 2 THEN
      RAISE EXCEPTION 'Limite de 2 reações por subfase atingido';
    END IF;
    
    -- Verificar CMD do GENERAL
    v_cmd_state := CASE WHEN v_player_number = 1 THEN v_state.player1_cmd_state ELSE v_state.player2_cmd_state END;
    v_general_cmd_free := COALESCE((v_cmd_state->'general'->>'cmd_free')::int, 0);
    
    IF v_general_cmd_free < v_cmd_cost THEN
      RAISE EXCEPTION 'CMD insuficiente no general (tem %, precisa %)', v_general_cmd_free, v_cmd_cost;
    END IF;
    
    -- Adicionar reação à lista
    v_reactions_this_phase := v_reactions_this_phase || jsonb_build_object(
      'player', v_player_number,
      'card', v_card,
      'cmd_cost', v_cmd_cost
    );
    v_board := jsonb_set(v_board, ARRAY['reactions_this_phase'], v_reactions_this_phase);
    
    -- Incrementar contador (exceto contra-manobra)
    IF NOT v_is_countermaneuver THEN
      v_board := jsonb_set(v_board, ARRAY[v_pkey, 'reaction_count'], to_jsonb(v_reaction_count + 1));
    END IF;
    
    -- Resetar "passed" de ambos (jogar reação cancela o pass anterior)
    v_board := jsonb_set(v_board, ARRAY['p1', 'reaction_passed'], 'false'::jsonb);
    v_board := jsonb_set(v_board, ARRAY['p2', 'reaction_passed'], 'false'::jsonb);
    
    -- Descontar CMD do general
    v_cmd_state := jsonb_set(v_cmd_state, ARRAY['general', 'cmd_free'], to_jsonb(v_general_cmd_free - v_cmd_cost));
    v_cmd_state := jsonb_set(v_cmd_state, ARRAY['general', 'cmd_spent'], 
      to_jsonb(COALESCE((v_cmd_state->'general'->>'cmd_spent')::int, 0) + v_cmd_cost)
    );
    
    -- Remover carta da mão
    v_hand := v_hand - p_card_index;
    
    -- Próxima vez é do oponente
    v_board := jsonb_set(v_board, ARRAY['reaction_turn'], to_jsonb(CASE WHEN v_player_number = 1 THEN 2 ELSE 1 END));
    
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
    VALUES (p_room_id, v_player_number, 'play_reaction', jsonb_build_object(
      'card_name', v_card->>'name',
      'cmd_cost', v_cmd_cost,
      'is_countermaneuver', v_is_countermaneuver
    ), 'combat', v_new_version);
    
    RETURN jsonb_build_object('success', true, 'version', v_new_version, 'card', v_card->>'name');
  END IF;
END;
$function$;

-- ============================================================================
-- 6) RPC: play_defense_maneuver - Defensor baixa manobra defensiva
-- ============================================================================
CREATE OR REPLACE FUNCTION public.play_defense_maneuver(
  p_room_id uuid,
  p_session_id text,
  p_card_index integer,
  p_commander_instance_id text
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
  v_current_defender INTEGER;
  v_pkey TEXT;
  v_hand jsonb;
  v_card jsonb;
  v_cmd_state jsonb;
  v_cmd_free INTEGER;
  v_cmd_cost INTEGER;
  v_existing_maneuvers jsonb;
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
  v_hand := CASE WHEN v_player_number = 1 THEN v_state.player1_hand ELSE v_state.player2_hand END;
  
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN
    RAISE EXCEPTION 'Índice de carta inválido';
  END IF;
  
  v_card := v_hand->p_card_index;
  v_cmd_cost := COALESCE((v_card->>'command_required')::int, 1);
  
  -- Verificar CMD do comandante
  v_cmd_state := CASE WHEN v_player_number = 1 THEN v_state.player1_cmd_state ELSE v_state.player2_cmd_state END;
  v_cmd_free := COALESCE((v_cmd_state->'commanders'->p_commander_instance_id->>'cmd_free')::int, 0);
  
  IF v_cmd_free < v_cmd_cost THEN
    RAISE EXCEPTION 'CMD insuficiente no comandante (tem %, precisa %)', v_cmd_free, v_cmd_cost;
  END IF;
  
  -- Adicionar manobra
  v_existing_maneuvers := COALESCE(v_board->v_pkey->'defense_maneuvers', '[]'::jsonb);
  v_existing_maneuvers := v_existing_maneuvers || jsonb_build_object(
    'card', v_card,
    'card_index', p_card_index,
    'commander_instance_id', p_commander_instance_id,
    'cmd_cost', v_cmd_cost
  );
  v_board := jsonb_set(v_board, ARRAY[v_pkey, 'defense_maneuvers'], v_existing_maneuvers);
  
  -- Descontar CMD
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
$function$;

-- ============================================================================
-- 7) RPC: confirm_defense_maneuvers - Defensor confirma e inicia reações
-- ============================================================================
CREATE OR REPLACE FUNCTION public.confirm_defense_maneuvers(
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
  v_new_version INTEGER;
  v_current_defender INTEGER;
  v_current_attacker INTEGER;
  v_pkey TEXT;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'defense_maneuver' THEN 
    RAISE EXCEPTION 'Não está na subfase de manobras de defesa'; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_current_defender := (v_board->>'current_defender')::int;
  v_current_attacker := (v_board->>'current_attacker')::int;
  
  IF v_player_number != v_current_defender THEN
    RAISE EXCEPTION 'Apenas o defensor pode confirmar manobras de defesa';
  END IF;
  
  v_pkey := 'p' || v_player_number;
  
  -- Marcar como confirmado
  v_board := jsonb_set(v_board, ARRAY[v_pkey, 'defense_maneuvers_confirmed'], 'true'::jsonb);
  
  -- Avançar para reações de defesa (atacante começa reagindo)
  v_board := jsonb_set(v_board, ARRAY['step'], '"defense_reaction"'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['reaction_turn'], to_jsonb(v_current_attacker));
  v_board := jsonb_set(v_board, ARRAY['reactions_this_phase'], '[]'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['both_passed_reaction'], 'false'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p1', 'reaction_count'], '0'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p1', 'reaction_passed'], 'false'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p2', 'reaction_count'], '0'::jsonb);
  v_board := jsonb_set(v_board, ARRAY['p2', 'reaction_passed'], 'false'::jsonb);
  
  UPDATE public.match_state 
  SET combat_board_state = v_board, 
      combat_phase = 'defense_reaction',
      version = version + 1, 
      updated_at = now() 
  WHERE room_id = p_room_id 
  RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'confirm_defense_maneuvers', jsonb_build_object(
    'maneuver_count', jsonb_array_length(COALESCE(v_board->v_pkey->'defense_maneuvers', '[]'::jsonb))
  ), 'combat', v_new_version);
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'step_advance', jsonb_build_object(
    'new_step', 'defense_reaction',
    'reaction_turn', v_current_attacker
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'step', 'defense_reaction');
END;
$function$;

-- ============================================================================
-- 8) RPC: resolve_combat_roll - Rolagem e dano CORRIGIDOS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.resolve_combat_roll(
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
  v_new_version INTEGER;
  v_current_attacker INTEGER;
  v_current_defender INTEGER;
  v_initiative_winner INTEGER;
  
  -- Atributos base
  v_atk_army_attack INTEGER;
  v_atk_strategy INTEGER;
  v_def_army_defense INTEGER;
  v_def_strategy INTEGER;
  
  -- Modificadores de terreno secundário
  v_sec_terrain_mods jsonb;
  v_atk_terrain_mod INTEGER := 0;
  v_def_terrain_mod INTEGER := 0;
  
  -- Modificadores de manobras
  v_atk_maneuver_mod INTEGER := 0;
  v_def_maneuver_mod INTEGER := 0;
  
  -- Modificadores de reações
  v_atk_reaction_mod INTEGER := 0;
  v_def_reaction_mod INTEGER := 0;
  
  -- Rolagem e resultado
  v_d20 INTEGER;
  v_attack_total INTEGER;
  v_defense_dc INTEGER;
  v_damage INTEGER;
  v_resolution jsonb;
  
  -- HP
  v_defender_hp INTEGER;
  v_new_hp INTEGER;
  
  -- Iteração
  v_maneuver jsonb;
  v_reaction jsonb;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'combat_roll' THEN 
    RAISE EXCEPTION 'Não está na subfase de rolagem (atual: %)', v_state.combat_phase; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_current_attacker := (v_board->>'current_attacker')::int;
  v_current_defender := (v_board->>'current_defender')::int;
  v_initiative_winner := COALESCE((v_board->'initiative_result'->>'winner_player_number')::int, 1);
  
  -- Atributos base do exército
  IF v_current_attacker = 1 THEN
    v_atk_army_attack := COALESCE((v_state.player1_army_attributes->>'attack')::int, 0);
    v_atk_strategy := COALESCE((v_state.player1_cmd_state->'general'->>'strategy_total')::int, 1);
    v_def_army_defense := COALESCE((v_state.player2_army_attributes->>'defense')::int, 0);
    v_def_strategy := COALESCE((v_state.player2_cmd_state->'general'->>'strategy_total')::int, 1);
    v_defender_hp := COALESCE(v_state.player2_hp, 100);
  ELSE
    v_atk_army_attack := COALESCE((v_state.player2_army_attributes->>'attack')::int, 0);
    v_atk_strategy := COALESCE((v_state.player2_cmd_state->'general'->>'strategy_total')::int, 1);
    v_def_army_defense := COALESCE((v_state.player1_army_attributes->>'defense')::int, 0);
    v_def_strategy := COALESCE((v_state.player1_cmd_state->'general'->>'strategy_total')::int, 1);
    v_defender_hp := COALESCE(v_state.player1_hp, 100);
  END IF;
  
  -- Modificadores de terreno secundário (apenas para o vencedor da iniciativa)
  v_sec_terrain_mods := COALESCE(v_board->'secondary_terrain_mods', '{}'::jsonb);
  IF v_current_attacker = v_initiative_winner THEN
    v_atk_terrain_mod := COALESCE((v_sec_terrain_mods->>'attack')::int, 0);
  END IF;
  IF v_current_defender = v_initiative_winner THEN
    v_def_terrain_mod := COALESCE((v_sec_terrain_mods->>'defense')::int, 0);
  END IF;
  
  -- Somar bônus das manobras de ataque
  FOR v_maneuver IN SELECT * FROM jsonb_array_elements(COALESCE(v_board->('p' || v_current_attacker)->'attack_maneuvers', '[]'::jsonb))
  LOOP
    v_atk_maneuver_mod := v_atk_maneuver_mod + COALESCE((v_maneuver->'card'->>'attack_bonus')::int, 0);
  END LOOP;
  
  -- Somar bônus das manobras de defesa
  FOR v_maneuver IN SELECT * FROM jsonb_array_elements(COALESCE(v_board->('p' || v_current_defender)->'defense_maneuvers', '[]'::jsonb))
  LOOP
    v_def_maneuver_mod := v_def_maneuver_mod + COALESCE((v_maneuver->'card'->>'defense_bonus')::int, 0);
  END LOOP;
  
  -- Somar bônus das reações (attack_reaction e defense_reaction combinados)
  FOR v_reaction IN SELECT * FROM jsonb_array_elements(COALESCE(v_board->'reactions_this_phase', '[]'::jsonb))
  LOOP
    IF (v_reaction->>'player')::int = v_current_attacker THEN
      v_atk_reaction_mod := v_atk_reaction_mod + COALESCE((v_reaction->'card'->>'attack_bonus')::int, 0);
    ELSE
      v_def_reaction_mod := v_def_reaction_mod + COALESCE((v_reaction->'card'->>'defense_bonus')::int, 0);
    END IF;
  END LOOP;
  
  -- Rolagem
  v_d20 := floor(random() * 20 + 1)::int;
  
  -- Fórmula correta: 1d20 + ATK_exército + Estratégia_general + mods
  v_attack_total := v_d20 + v_atk_army_attack + v_atk_strategy + v_atk_terrain_mod + v_atk_maneuver_mod + v_atk_reaction_mod;
  
  -- DC: DEF_exército + 5 + Estratégia_general + mods
  v_defense_dc := v_def_army_defense + 5 + v_def_strategy + v_def_terrain_mod + v_def_maneuver_mod + v_def_reaction_mod;
  
  -- Dano: 0 se falhar, 1 + floor((ATK - DC)/5) se vencer
  IF v_attack_total > v_defense_dc THEN
    v_damage := 1 + floor((v_attack_total - v_defense_dc)::numeric / 5)::int;
  ELSE
    v_damage := 0;
  END IF;
  
  -- Aplicar dano
  v_new_hp := GREATEST(0, v_defender_hp - v_damage);
  
  -- Construir breakdown
  v_resolution := jsonb_build_object(
    'round', v_state.combat_round,
    'attacker', v_current_attacker,
    'defender', v_current_defender,
    'd20', v_d20,
    'attack_base', v_atk_army_attack,
    'attack_strategy', v_atk_strategy,
    'attack_terrain_mod', v_atk_terrain_mod,
    'attack_maneuver_mod', v_atk_maneuver_mod,
    'attack_reaction_mod', v_atk_reaction_mod,
    'attack_total', v_attack_total,
    'defense_base', v_def_army_defense,
    'defense_fixed', 5,
    'defense_strategy', v_def_strategy,
    'defense_terrain_mod', v_def_terrain_mod,
    'defense_maneuver_mod', v_def_maneuver_mod,
    'defense_reaction_mod', v_def_reaction_mod,
    'defense_dc', v_defense_dc,
    'damage', v_damage,
    'defender_hp_before', v_defender_hp,
    'defender_hp_after', v_new_hp,
    'attack_maneuvers', COALESCE(v_board->('p' || v_current_attacker)->'attack_maneuvers', '[]'::jsonb),
    'defense_maneuvers', COALESCE(v_board->('p' || v_current_defender)->'defense_maneuvers', '[]'::jsonb),
    'reactions', COALESCE(v_board->'reactions_this_phase', '[]'::jsonb)
  );
  
  -- Salvar resolução no board
  v_board := jsonb_set(v_board, ARRAY['last_resolution'], v_resolution);
  v_board := jsonb_set(v_board, ARRAY['step'], '"combat_resolution"'::jsonb);
  
  -- Atualizar HP
  IF v_current_defender = 1 THEN
    UPDATE public.match_state 
    SET combat_board_state = v_board, 
        combat_phase = 'combat_resolution',
        player1_hp = v_new_hp,
        version = version + 1, 
        updated_at = now() 
    WHERE room_id = p_room_id 
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state 
    SET combat_board_state = v_board, 
        combat_phase = 'combat_resolution',
        player2_hp = v_new_hp,
        version = version + 1, 
        updated_at = now() 
    WHERE room_id = p_room_id 
    RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'combat_roll_resolved', v_resolution, 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'resolution', v_resolution);
END;
$function$;