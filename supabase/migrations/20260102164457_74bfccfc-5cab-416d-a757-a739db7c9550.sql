
-- ===================================================
-- FIX: Align combat_phase and combat_board_state.step
-- FIX: Ensure start_combat distributes hands properly
-- ===================================================

-- 1) Fix confirm_initiative: ALSO update combat_phase when advancing to main
CREATE OR REPLACE FUNCTION public.confirm_initiative(p_room_id uuid, p_session_id text)
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
  v_new_version INTEGER;
  v_my_confirmed BOOLEAN;
  v_opponent_confirmed BOOLEAN;
  v_card jsonb;
  v_cmd_state jsonb;
  v_cmd_required INTEGER;
  v_cmd_spent INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  IF v_state.combat_phase != 'initiative' THEN RAISE EXCEPTION 'Não está na fase de iniciativa'; END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  -- Checar se já confirmou
  IF COALESCE((v_board->v_player_key->>'confirmed')::boolean, false) THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'version', v_state.version);
  END IF;
  
  -- Gastar CMD se carta selecionada
  v_card := v_board->v_player_key->'initiative_card';
  IF v_card IS NOT NULL AND v_card != 'null'::jsonb THEN
    v_cmd_required := COALESCE((v_card->>'command_required')::int, 0);
    IF v_cmd_required > 0 THEN
      IF v_player_number = 1 THEN
        v_cmd_state := COALESCE(v_state.player1_cmd_state, '{}'::jsonb);
      ELSE
        v_cmd_state := COALESCE(v_state.player2_cmd_state, '{}'::jsonb);
      END IF;
      
      v_cmd_spent := COALESCE((v_cmd_state->>'cmd_spent')::int, 0) + v_cmd_required;
      v_cmd_state := jsonb_set(v_cmd_state, '{cmd_spent}', to_jsonb(v_cmd_spent));
      v_cmd_state := jsonb_set(v_cmd_state, '{cmd_free}', to_jsonb(COALESCE((v_cmd_state->>'cmd_total')::int, 1) - v_cmd_spent));
      
      IF v_player_number = 1 THEN
        UPDATE public.match_state SET player1_cmd_state = v_cmd_state WHERE room_id = p_room_id;
      ELSE
        UPDATE public.match_state SET player2_cmd_state = v_cmd_state WHERE room_id = p_room_id;
      END IF;
    END IF;
  END IF;
  
  -- Marcar como confirmado
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'confirmed'], 'true'::jsonb);
  UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
  VALUES (p_room_id, v_player_number, 'confirm_initiative', jsonb_build_object('cmd_required', v_cmd_required), 'combat', v_new_version);
  
  -- Se ambos confirmaram, avançar para main
  v_my_confirmed := true;
  v_opponent_confirmed := COALESCE((v_board->(CASE WHEN v_player_number = 1 THEN 'p2' ELSE 'p1' END)->>'confirmed')::boolean, false);
  
  IF v_opponent_confirmed THEN
    v_board := jsonb_set(v_board, '{step}', '"main"'::jsonb);
    v_board := jsonb_set(v_board, '{p1,confirmed}', 'false'::jsonb);
    v_board := jsonb_set(v_board, '{p2,confirmed}', 'false'::jsonb);
    
    -- FIX: ALSO update combat_phase to 'main'
    UPDATE public.match_state SET 
      combat_board_state = v_board, 
      combat_phase = 'main',  -- <-- THIS WAS MISSING
      version = version + 1, 
      updated_at = now() 
    WHERE room_id = p_room_id RETURNING version INTO v_new_version;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
    VALUES (p_room_id, 0, 'advance_to_main', jsonb_build_object('round', v_state.combat_round), 'combat', v_new_version);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version);
END;
$function$;

-- 2) Fix select_main_card: Check combat_phase instead of board step
CREATE OR REPLACE FUNCTION public.select_main_card(p_room_id uuid, p_session_id text, p_card_index integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_hand jsonb;
  v_card jsonb;
  v_board jsonb;
  v_player_key text;
  v_new_version INTEGER;
  v_cmd_state jsonb;
  v_cmd_free INTEGER;
  v_strategy_total INTEGER;
  v_card_cmd_req INTEGER;
  v_card_strat_req INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  -- FIX: Check combat_phase instead of board step
  IF v_state.combat_phase != 'main' THEN 
    RAISE EXCEPTION 'Não está na fase principal. Fase atual: %', v_state.combat_phase; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  IF v_player_number = 1 THEN
    v_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
    v_cmd_state := COALESCE(v_state.player1_cmd_state, '{"cmd_free": 0, "strategy_total": 0}'::jsonb);
  ELSE
    v_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
    v_cmd_state := COALESCE(v_state.player2_cmd_state, '{"cmd_free": 0, "strategy_total": 0}'::jsonb);
  END IF;
  
  IF jsonb_array_length(v_hand) = 0 THEN
    RAISE EXCEPTION 'Sua mão está vazia. Verifique se o combate foi iniciado corretamente.';
  END IF;
  
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN RAISE EXCEPTION 'Índice inválido'; END IF;
  
  v_card := v_hand->p_card_index;
  v_cmd_free := COALESCE((v_cmd_state->'general'->>'cmd_free')::int, COALESCE((v_cmd_state->>'cmd_free')::int, 3));
  v_strategy_total := COALESCE((v_cmd_state->'general'->>'strategy_total')::int, COALESCE((v_cmd_state->>'strategy_total')::int, 3));
  v_card_cmd_req := COALESCE((v_card->>'command_required')::int, 0);
  v_card_strat_req := COALESCE((v_card->>'strategy_required')::int, 0);
  
  IF v_card_cmd_req > v_cmd_free THEN
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
    VALUES (p_room_id, v_player_number, 'card_selection_blocked', jsonb_build_object('reason', 'insufficient_cmd', 'required', v_card_cmd_req, 'available', v_cmd_free, 'phase', 'main'), 'combat', v_state.version);
    RAISE EXCEPTION 'Comando insuficiente. Requer: %, Disponível: %', v_card_cmd_req, v_cmd_free;
  END IF;
  
  IF v_card_strat_req > v_strategy_total THEN
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
    VALUES (p_room_id, v_player_number, 'card_selection_blocked', jsonb_build_object('reason', 'insufficient_strategy', 'required', v_card_strat_req, 'available', v_strategy_total, 'phase', 'main'), 'combat', v_state.version);
    RAISE EXCEPTION 'Estratégia insuficiente. Requer: %, Disponível: %', v_card_strat_req, v_strategy_total;
  END IF;
  
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'main_card'], v_card);
  UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
  VALUES (p_room_id, v_player_number, 'select_main_card', jsonb_build_object('card_name', v_card->>'name', 'cmd_req', v_card_cmd_req), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'selected_card', v_card);
END;
$function$;

-- 3) Fix confirm_main: Check combat_phase instead of board step
CREATE OR REPLACE FUNCTION public.confirm_main(p_room_id uuid, p_session_id text)
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
  v_opponent_key text;
  v_new_version INTEGER;
  v_opponent_confirmed BOOLEAN;
  v_card jsonb;
  v_cmd_state jsonb;
  v_cmd_required INTEGER;
  v_cmd_spent INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  v_opponent_key := CASE WHEN v_player_number = 1 THEN 'p2' ELSE 'p1' END;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  -- FIX: Check combat_phase instead of board step
  IF v_state.combat_phase != 'main' THEN 
    RAISE EXCEPTION 'Não está na fase principal. Fase atual: %', v_state.combat_phase; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  -- Já confirmou?
  IF COALESCE((v_board->v_player_key->>'confirmed')::boolean, false) THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'version', v_state.version);
  END IF;
  
  -- Deve ter carta selecionada
  v_card := v_board->v_player_key->'main_card';
  IF v_card IS NULL OR v_card = 'null'::jsonb THEN
    RAISE EXCEPTION 'Selecione uma carta principal antes de confirmar';
  END IF;
  
  -- Gastar CMD
  v_cmd_required := COALESCE((v_card->>'command_required')::int, 0);
  IF v_cmd_required > 0 THEN
    IF v_player_number = 1 THEN
      v_cmd_state := COALESCE(v_state.player1_cmd_state, '{}'::jsonb);
    ELSE
      v_cmd_state := COALESCE(v_state.player2_cmd_state, '{}'::jsonb);
    END IF;
    
    v_cmd_spent := COALESCE((v_cmd_state->>'cmd_spent')::int, 0) + v_cmd_required;
    v_cmd_state := jsonb_set(v_cmd_state, '{cmd_spent}', to_jsonb(v_cmd_spent));
    v_cmd_state := jsonb_set(v_cmd_state, '{cmd_free}', to_jsonb(COALESCE((v_cmd_state->>'cmd_total')::int, 1) - v_cmd_spent));
    
    IF v_player_number = 1 THEN
      UPDATE public.match_state SET player1_cmd_state = v_cmd_state WHERE room_id = p_room_id;
    ELSE
      UPDATE public.match_state SET player2_cmd_state = v_cmd_state WHERE room_id = p_room_id;
    END IF;
  END IF;
  
  -- Marcar confirmado
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'confirmed'], 'true'::jsonb);
  UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
  VALUES (p_room_id, v_player_number, 'confirm_main', jsonb_build_object('card', v_card->>'name', 'cmd_spent', v_cmd_required), 'combat', v_new_version);
  
  -- Se ambos confirmaram, resolver rodada
  v_opponent_confirmed := COALESCE((v_board->v_opponent_key->>'confirmed')::boolean, false);
  
  IF v_opponent_confirmed THEN
    PERFORM public.resolve_combat_round(p_room_id);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version);
END;
$function$;

-- 4) Fix start_combat: Properly distribute hands
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
  v_p1_hand jsonb := '[]'::jsonb;
  v_p2_hand jsonb := '[]'::jsonb;
  v_new_version INTEGER;
  v_initial_board jsonb;
  v_p1_general RECORD;
  v_p2_general RECORD;
  v_p1_cmd_state jsonb;
  v_p2_cmd_state jsonb;
BEGIN
  -- Buscar sala e estado
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  -- ========================================
  -- IDEMPOTENCY CHECK: Se já está em combate, retornar sucesso sem re-executar
  -- ========================================
  IF v_state.combat_phase IS NOT NULL AND v_state.combat_phase NOT IN ('pre_combat', '') THEN
    RETURN jsonb_build_object(
      'success', true, 
      'version', v_state.version,
      'already_started', true,
      'combat_phase', v_state.combat_phase,
      'p1_hand_size', jsonb_array_length(COALESCE(v_state.player1_hand, '[]'::jsonb)),
      'p2_hand_size', jsonb_array_length(COALESCE(v_state.player2_hand, '[]'::jsonb))
    );
  END IF;
  
  -- Verificar se ambos confirmaram deck
  IF NOT (v_state.player1_deck_confirmed AND v_state.player2_deck_confirmed) THEN
    RAISE EXCEPTION 'Ambos jogadores precisam confirmar o deck';
  END IF;
  
  -- ========================================
  -- FIX: Properly build hands from deck categories
  -- ========================================
  v_p1_deck := COALESCE(v_state.player1_deck, '{}'::jsonb);
  v_p2_deck := COALESCE(v_state.player2_deck, '{}'::jsonb);
  
  -- Player 1: combine ALL cards from deck into hand
  v_p1_hand := COALESCE(v_p1_deck->'initiative', '[]'::jsonb) 
            || COALESCE(v_p1_deck->'offensive', '[]'::jsonb)
            || COALESCE(v_p1_deck->'defensive', '[]'::jsonb)
            || COALESCE(v_p1_deck->'reactions', '[]'::jsonb);
  
  -- Player 2: combine ALL cards from deck into hand
  v_p2_hand := COALESCE(v_p2_deck->'initiative', '[]'::jsonb) 
            || COALESCE(v_p2_deck->'offensive', '[]'::jsonb)
            || COALESCE(v_p2_deck->'defensive', '[]'::jsonb)
            || COALESCE(v_p2_deck->'reactions', '[]'::jsonb);
  
  -- Log if hands are empty
  IF jsonb_array_length(v_p1_hand) = 0 THEN
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 1, 'warning_empty_deck', jsonb_build_object('message', 'Player 1 deck vazio'), 'deckbuilding', v_state.version);
  END IF;
  
  IF jsonb_array_length(v_p2_hand) = 0 THEN
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 2, 'warning_empty_deck', jsonb_build_object('message', 'Player 2 deck vazio'), 'deckbuilding', v_state.version);
  END IF;
  
  -- Buscar general de cada jogador para CMD inicial
  SELECT * INTO v_p1_general FROM public.mass_combat_commander_templates 
  WHERE id = v_state.player1_general_id;
  
  SELECT * INTO v_p2_general FROM public.mass_combat_commander_templates 
  WHERE id = v_state.player2_general_id;
  
  -- Inicializar CMD state com estrategia do general
  v_p1_cmd_state := jsonb_build_object(
    'general', jsonb_build_object(
      'id', v_state.player1_general_id,
      'cmd_total', COALESCE(v_p1_general.comando, 3),
      'cmd_spent', 0,
      'cmd_free', COALESCE(v_p1_general.comando, 3),
      'strategy_total', COALESCE(v_p1_general.estrategia, 3)
    ),
    'commanders', '{}'::jsonb
  );
  
  v_p2_cmd_state := jsonb_build_object(
    'general', jsonb_build_object(
      'id', v_state.player2_general_id,
      'cmd_total', COALESCE(v_p2_general.comando, 3),
      'cmd_spent', 0,
      'cmd_free', COALESCE(v_p2_general.comando, 3),
      'strategy_total', COALESCE(v_p2_general.estrategia, 3)
    ),
    'commanders', '{}'::jsonb
  );
  
  -- Estrutura inicial do board (step MUST match combat_phase)
  v_initial_board := jsonb_build_object(
    'step', 'initiative',  -- Match combat_phase
    'p1', jsonb_build_object(
      'initiative_card', null,
      'main_card', null,
      'confirmed', false,
      'basic_bonuses', '{}'::jsonb
    ),
    'p2', jsonb_build_object(
      'initiative_card', null,
      'main_card', null,
      'confirmed', false,
      'basic_bonuses', '{}'::jsonb
    ),
    'last_resolution', null
  );
  
  -- Atualizar match_state
  UPDATE public.match_state
  SET 
    combat_phase = 'initiative',  -- Source of truth
    combat_round = 1,
    combat_board_state = v_initial_board,
    player1_hand = v_p1_hand,
    player2_hand = v_p2_hand,
    player1_discard = '[]'::jsonb,
    player2_discard = '[]'::jsonb,
    player1_hp = 100,
    player2_hp = 100,
    player1_cmd_state = v_p1_cmd_state,
    player2_cmd_state = v_p2_cmd_state,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Atualizar fase da sala
  UPDATE public.rooms 
  SET current_phase = 'combat', status = 'in_progress', updated_at = now() 
  WHERE id = p_room_id;
  
  -- Log
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'start_combat', jsonb_build_object(
    'combat_round', 1,
    'p1_hand_size', jsonb_array_length(v_p1_hand),
    'p2_hand_size', jsonb_array_length(v_p2_hand),
    'p1_general_cmd', COALESCE(v_p1_general.comando, 3),
    'p2_general_cmd', COALESCE(v_p2_general.comando, 3)
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'combat_phase', 'initiative',
    'p1_hand_size', jsonb_array_length(v_p1_hand),
    'p2_hand_size', jsonb_array_length(v_p2_hand)
  );
END;
$function$;

-- 5) Also add overload for start_combat with session_id parameter (used by UI)
CREATE OR REPLACE FUNCTION public.start_combat(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Just delegate to the main function (session validation can be added later if needed)
  RETURN public.start_combat(p_room_id);
END;
$function$;
