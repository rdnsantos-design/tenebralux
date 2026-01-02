-- ================================================
-- VERTICAL SLICE: Deployment + Basic Cards + Combat RPCs
-- ================================================

-- 1. Adicionar 'deployment' ao enum game_phase
ALTER TYPE public.game_phase ADD VALUE IF NOT EXISTS 'deployment' AFTER 'deckbuilding';

-- 2. Adicionar colunas de deployment ao match_state
ALTER TABLE public.match_state 
ADD COLUMN IF NOT EXISTS player1_deployment_formation text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS player2_deployment_formation text DEFAULT NULL;

-- Garantir que deployment_confirmed existe (já pode existir)
-- Usar DO block para evitar erros
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'match_state' AND column_name = 'player1_deployment_confirmed') THEN
    ALTER TABLE public.match_state ADD COLUMN player1_deployment_confirmed boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'match_state' AND column_name = 'player2_deployment_confirmed') THEN
    ALTER TABLE public.match_state ADD COLUMN player2_deployment_confirmed boolean DEFAULT false;
  END IF;
END $$;

-- 3. Adicionar colunas de basic cards usados (por partida)
ALTER TABLE public.match_state 
ADD COLUMN IF NOT EXISTS player1_basic_cards_used jsonb DEFAULT '{"heal": false, "attack": false, "defense": false, "initiative": false, "countermaneuver": false}'::jsonb,
ADD COLUMN IF NOT EXISTS player2_basic_cards_used jsonb DEFAULT '{"heal": false, "attack": false, "defense": false, "initiative": false, "countermaneuver": false}'::jsonb;

-- ================================================
-- CONFIRM_DECKBUILDING: Avança para deployment
-- ================================================
DROP FUNCTION IF EXISTS public.confirm_deckbuilding(uuid, text);

CREATE OR REPLACE FUNCTION public.confirm_deckbuilding(
  p_room_id uuid,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_room RECORD;
  v_new_version INTEGER;
  v_both_confirmed BOOLEAN;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN RAISE EXCEPTION 'Sala não encontrada'; END IF;
  IF v_room.current_phase != 'deckbuilding' THEN RAISE EXCEPTION 'Não está na fase de deckbuilding'; END IF;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  -- Idempotência: se já confirmou, retorna sucesso
  IF v_player_number = 1 AND v_state.player1_deck_confirmed THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'version', v_state.version);
  END IF;
  IF v_player_number = 2 AND v_state.player2_deck_confirmed THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'version', v_state.version);
  END IF;
  
  -- Marcar como confirmado
  IF v_player_number = 1 THEN
    UPDATE public.match_state SET player1_deck_confirmed = true, version = version + 1, updated_at = now() WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state SET player2_deck_confirmed = true, version = version + 1, updated_at = now() WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
  VALUES (p_room_id, v_player_number, 'confirm_deckbuilding', jsonb_build_object('confirmed', true), 'deckbuilding', v_new_version);
  
  -- Checar se ambos confirmaram
  SELECT player1_deck_confirmed AND player2_deck_confirmed INTO v_both_confirmed FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_both_confirmed THEN
    -- Avançar para deployment (não combat direto)
    UPDATE public.rooms SET current_phase = 'deployment', updated_at = now() WHERE id = p_room_id;
    UPDATE public.match_state SET version = version + 1, updated_at = now() WHERE room_id = p_room_id RETURNING version INTO v_new_version;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
    VALUES (p_room_id, 0, 'phase_transition', jsonb_build_object('from', 'deckbuilding', 'to', 'deployment'), 'deployment', v_new_version);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'both_confirmed', v_both_confirmed);
END;
$$;

-- ================================================
-- CONFIRM_DEPLOYMENT: Avança para combat quando ambos confirmarem
-- ================================================
DROP FUNCTION IF EXISTS public.confirm_deployment(uuid, text, text);

CREATE OR REPLACE FUNCTION public.confirm_deployment(
  p_room_id uuid,
  p_session_id text,
  p_formation text DEFAULT 'balanced'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_room RECORD;
  v_new_version INTEGER;
  v_both_confirmed BOOLEAN;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN RAISE EXCEPTION 'Sala não encontrada'; END IF;
  IF v_room.current_phase != 'deployment' THEN RAISE EXCEPTION 'Não está na fase de deployment'; END IF;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  -- Validar formação
  IF p_formation NOT IN ('aggressive', 'balanced', 'defensive') THEN
    p_formation := 'balanced';
  END IF;
  
  -- Idempotência
  IF v_player_number = 1 AND v_state.player1_deployment_confirmed THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'version', v_state.version);
  END IF;
  IF v_player_number = 2 AND v_state.player2_deployment_confirmed THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'version', v_state.version);
  END IF;
  
  -- Salvar formação e confirmar
  IF v_player_number = 1 THEN
    UPDATE public.match_state 
    SET player1_deployment_formation = p_formation, player1_deployment_confirmed = true, version = version + 1, updated_at = now() 
    WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state 
    SET player2_deployment_formation = p_formation, player2_deployment_confirmed = true, version = version + 1, updated_at = now() 
    WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
  VALUES (p_room_id, v_player_number, 'confirm_deployment', jsonb_build_object('formation', p_formation), 'deployment', v_new_version);
  
  -- Checar se ambos confirmaram
  SELECT player1_deployment_confirmed AND player2_deployment_confirmed INTO v_both_confirmed FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_both_confirmed THEN
    -- Iniciar combate
    PERFORM public.start_combat(p_room_id, p_session_id);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'both_confirmed', v_both_confirmed);
END;
$$;

-- ================================================
-- START_COMBAT: Idempotente, inicializa CMD/EST e basic cards
-- ================================================
DROP FUNCTION IF EXISTS public.start_combat(uuid, text);

CREATE OR REPLACE FUNCTION public.start_combat(
  p_room_id uuid,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state RECORD;
  v_new_version INTEGER;
  v_p1_cmd_state jsonb;
  v_p2_cmd_state jsonb;
  v_p1_general jsonb;
  v_p2_general jsonb;
  v_p1_commanders jsonb;
  v_p2_commanders jsonb;
  v_cmd_total INTEGER;
  v_strategy_total INTEGER;
BEGIN
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  -- Idempotência: não reiniciar se já iniciado
  IF v_state.combat_phase IS NOT NULL AND v_state.combat_phase NOT IN ('pre_combat', '') THEN
    RETURN jsonb_build_object('success', true, 'already_started', true, 'version', v_state.version);
  END IF;
  
  -- Calcular CMD/EST para Player 1
  v_p1_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
  v_cmd_total := 0;
  v_strategy_total := 0;
  
  -- Somar comandantes
  FOR v_p1_general IN SELECT * FROM jsonb_array_elements(v_p1_commanders)
  LOOP
    v_cmd_total := v_cmd_total + COALESCE((v_p1_general->>'comando_base')::int, (v_p1_general->>'comando')::int, 1);
    v_strategy_total := v_strategy_total + COALESCE((v_p1_general->>'estrategia')::int, 1);
  END LOOP;
  
  -- Fallback mínimo
  IF v_cmd_total = 0 THEN v_cmd_total := 1; END IF;
  IF v_strategy_total = 0 THEN v_strategy_total := 1; END IF;
  
  v_p1_cmd_state := jsonb_build_object(
    'cmd_total', v_cmd_total,
    'cmd_free', v_cmd_total,
    'cmd_spent', 0,
    'strategy_total', v_strategy_total
  );
  
  -- Calcular CMD/EST para Player 2
  v_p2_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
  v_cmd_total := 0;
  v_strategy_total := 0;
  
  FOR v_p2_general IN SELECT * FROM jsonb_array_elements(v_p2_commanders)
  LOOP
    v_cmd_total := v_cmd_total + COALESCE((v_p2_general->>'comando_base')::int, (v_p2_general->>'comando')::int, 1);
    v_strategy_total := v_strategy_total + COALESCE((v_p2_general->>'estrategia')::int, 1);
  END LOOP;
  
  IF v_cmd_total = 0 THEN v_cmd_total := 1; END IF;
  IF v_strategy_total = 0 THEN v_strategy_total := 1; END IF;
  
  v_p2_cmd_state := jsonb_build_object(
    'cmd_total', v_cmd_total,
    'cmd_free', v_cmd_total,
    'cmd_spent', 0,
    'strategy_total', v_strategy_total
  );
  
  -- Atualizar estado
  UPDATE public.match_state SET
    combat_phase = 'initiative',
    combat_round = 1,
    player1_cmd_state = v_p1_cmd_state,
    player2_cmd_state = v_p2_cmd_state,
    player1_basic_cards_granted = true,
    player2_basic_cards_granted = true,
    player1_basic_cards_used = '{"heal": false, "attack": false, "defense": false, "initiative": false, "countermaneuver": false}'::jsonb,
    player2_basic_cards_used = '{"heal": false, "attack": false, "defense": false, "initiative": false, "countermaneuver": false}'::jsonb,
    combat_board_state = jsonb_build_object(
      'step', 'initiative',
      'p1', jsonb_build_object('initiative_card', null, 'main_card', null, 'confirmed', false, 'basic_bonuses', jsonb_build_object()),
      'p2', jsonb_build_object('initiative_card', null, 'main_card', null, 'confirmed', false, 'basic_bonuses', jsonb_build_object()),
      'last_resolution', null
    ),
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Atualizar fase da sala
  UPDATE public.rooms SET current_phase = 'combat', updated_at = now() WHERE id = p_room_id;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
  VALUES (p_room_id, 0, 'start_combat', jsonb_build_object('p1_cmd', v_p1_cmd_state, 'p2_cmd', v_p2_cmd_state), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version);
END;
$$;

-- ================================================
-- USE_BASIC_CARD: Usar carta básica (1x por partida)
-- ================================================
DROP FUNCTION IF EXISTS public.use_basic_card(uuid, text, text);

CREATE OR REPLACE FUNCTION public.use_basic_card(
  p_room_id uuid,
  p_session_id text,
  p_card_type text -- 'heal', 'attack', 'defense', 'initiative', 'countermaneuver'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_used_cards jsonb;
  v_board jsonb;
  v_player_key text;
  v_new_version INTEGER;
  v_already_used BOOLEAN;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  IF v_state.combat_phase IS NULL OR v_state.combat_phase NOT IN ('initiative', 'main') THEN 
    RAISE EXCEPTION 'Não está em fase de combate ativa'; 
  END IF;
  
  -- Validar tipo de carta
  IF p_card_type NOT IN ('heal', 'attack', 'defense', 'initiative', 'countermaneuver') THEN
    RAISE EXCEPTION 'Tipo de carta inválido: %', p_card_type;
  END IF;
  
  -- Verificar se já usou
  IF v_player_number = 1 THEN
    v_used_cards := COALESCE(v_state.player1_basic_cards_used, '{}'::jsonb);
  ELSE
    v_used_cards := COALESCE(v_state.player2_basic_cards_used, '{}'::jsonb);
  END IF;
  
  v_already_used := COALESCE((v_used_cards->>p_card_type)::boolean, false);
  IF v_already_used THEN
    RAISE EXCEPTION 'Carta básica "%" já foi usada nesta partida', p_card_type;
  END IF;
  
  -- Marcar como usada
  v_used_cards := jsonb_set(v_used_cards, ARRAY[p_card_type], 'true'::jsonb);
  
  -- Aplicar bônus no board state
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  IF v_board->v_player_key->'basic_bonuses' IS NULL THEN
    v_board := jsonb_set(v_board, ARRAY[v_player_key, 'basic_bonuses'], '{}'::jsonb);
  END IF;
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'basic_bonuses', p_card_type], 'true'::jsonb);
  
  -- Atualizar estado
  IF v_player_number = 1 THEN
    UPDATE public.match_state 
    SET player1_basic_cards_used = v_used_cards, combat_board_state = v_board, version = version + 1, updated_at = now() 
    WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state 
    SET player2_basic_cards_used = v_used_cards, combat_board_state = v_board, version = version + 1, updated_at = now() 
    WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
  VALUES (p_room_id, v_player_number, 'use_basic_card', jsonb_build_object('card_type', p_card_type), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'card_used', p_card_type);
END;
$$;

-- ================================================
-- CONFIRM_INITIATIVE: Com gasto de CMD
-- ================================================
DROP FUNCTION IF EXISTS public.confirm_initiative(uuid, text);

CREATE OR REPLACE FUNCTION public.confirm_initiative(
  p_room_id uuid,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    
    UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() WHERE room_id = p_room_id RETURNING version INTO v_new_version;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
    VALUES (p_room_id, 0, 'advance_to_main', jsonb_build_object('round', v_state.combat_round), 'combat', v_new_version);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version);
END;
$$;

-- ================================================
-- SELECT_MAIN_CARD: Com validação CMD/EST
-- ================================================
DROP FUNCTION IF EXISTS public.select_main_card(uuid, text, integer);

CREATE OR REPLACE FUNCTION public.select_main_card(
  p_room_id uuid,
  p_session_id text,
  p_card_index integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  IF (v_board->>'step') != 'main' THEN RAISE EXCEPTION 'Não está na fase principal'; END IF;
  
  IF v_player_number = 1 THEN
    v_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
    v_cmd_state := COALESCE(v_state.player1_cmd_state, '{"cmd_free": 0, "strategy_total": 0}'::jsonb);
  ELSE
    v_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
    v_cmd_state := COALESCE(v_state.player2_cmd_state, '{"cmd_free": 0, "strategy_total": 0}'::jsonb);
  END IF;
  
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN RAISE EXCEPTION 'Índice inválido'; END IF;
  
  v_card := v_hand->p_card_index;
  v_cmd_free := COALESCE((v_cmd_state->>'cmd_free')::int, 0);
  v_strategy_total := COALESCE((v_cmd_state->>'strategy_total')::int, 0);
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
$$;

-- ================================================
-- CONFIRM_MAIN: Gasta CMD e resolve rodada se ambos confirmaram
-- ================================================
DROP FUNCTION IF EXISTS public.confirm_main(uuid, text);

CREATE OR REPLACE FUNCTION public.confirm_main(
  p_room_id uuid,
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  IF (v_board->>'step') != 'main' THEN RAISE EXCEPTION 'Não está na fase principal'; END IF;
  
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
$$;

-- ================================================
-- RESOLVE_COMBAT_ROUND: Calcula dano e avança
-- ================================================
DROP FUNCTION IF EXISTS public.resolve_combat_round(uuid);

CREATE OR REPLACE FUNCTION public.resolve_combat_round(
  p_room_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state RECORD;
  v_board jsonb;
  v_new_version INTEGER;
  v_p1_init jsonb;
  v_p2_init jsonb;
  v_p1_main jsonb;
  v_p2_main jsonb;
  v_p1_basic jsonb;
  v_p2_basic jsonb;
  v_p1_attrs jsonb;
  v_p2_attrs jsonb;
  v_p1_atk INTEGER := 0;
  v_p1_def INTEGER := 0;
  v_p1_mob INTEGER := 0;
  v_p2_atk INTEGER := 0;
  v_p2_def INTEGER := 0;
  v_p2_mob INTEGER := 0;
  v_p1_damage INTEGER := 0;
  v_p2_damage INTEGER := 0;
  v_p1_hp INTEGER;
  v_p2_hp INTEGER;
  v_init_winner INTEGER;
  v_combat_finished BOOLEAN := false;
  v_winner INTEGER := NULL;
  v_resolution jsonb;
  v_new_round INTEGER;
  v_p1_cmd_state jsonb;
  v_p2_cmd_state jsonb;
BEGIN
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_p1_hp := COALESCE(v_state.player1_hp, 100);
  v_p2_hp := COALESCE(v_state.player2_hp, 100);
  
  -- Extrair cartas
  v_p1_init := v_board->'p1'->'initiative_card';
  v_p2_init := v_board->'p2'->'initiative_card';
  v_p1_main := v_board->'p1'->'main_card';
  v_p2_main := v_board->'p2'->'main_card';
  v_p1_basic := COALESCE(v_board->'p1'->'basic_bonuses', '{}'::jsonb);
  v_p2_basic := COALESCE(v_board->'p2'->'basic_bonuses', '{}'::jsonb);
  
  -- Atributos base do exército
  v_p1_attrs := COALESCE(v_state.player1_army_attributes, '{"attack":0,"defense":0,"mobility":0}'::jsonb);
  v_p2_attrs := COALESCE(v_state.player2_army_attributes, '{"attack":0,"defense":0,"mobility":0}'::jsonb);
  
  -- Calcular stats P1
  v_p1_atk := COALESCE((v_p1_attrs->>'attack')::int, 0);
  v_p1_def := COALESCE((v_p1_attrs->>'defense')::int, 0);
  v_p1_mob := COALESCE((v_p1_attrs->>'mobility')::int, 0);
  
  -- Adicionar bônus de cartas P1
  IF v_p1_init IS NOT NULL AND v_p1_init != 'null'::jsonb THEN
    v_p1_mob := v_p1_mob + COALESCE((v_p1_init->>'mobility_bonus')::int, 0);
  END IF;
  IF v_p1_main IS NOT NULL AND v_p1_main != 'null'::jsonb THEN
    v_p1_atk := v_p1_atk + COALESCE((v_p1_main->>'attack_bonus')::int, 0);
    v_p1_def := v_p1_def + COALESCE((v_p1_main->>'defense_bonus')::int, 0);
    v_p1_mob := v_p1_mob + COALESCE((v_p1_main->>'mobility_bonus')::int, 0);
  END IF;
  
  -- Basic cards P1
  IF (v_p1_basic->>'attack')::boolean THEN v_p1_atk := v_p1_atk + 1; END IF;
  IF (v_p1_basic->>'defense')::boolean THEN v_p1_def := v_p1_def + 1; END IF;
  IF (v_p1_basic->>'initiative')::boolean THEN v_p1_mob := v_p1_mob + 1; END IF;
  IF (v_p2_basic->>'countermaneuver')::boolean THEN v_p1_mob := v_p1_mob - (v_p1_mob / 2); END IF; -- opponent's countermaneuver
  
  -- Calcular stats P2
  v_p2_atk := COALESCE((v_p2_attrs->>'attack')::int, 0);
  v_p2_def := COALESCE((v_p2_attrs->>'defense')::int, 0);
  v_p2_mob := COALESCE((v_p2_attrs->>'mobility')::int, 0);
  
  IF v_p2_init IS NOT NULL AND v_p2_init != 'null'::jsonb THEN
    v_p2_mob := v_p2_mob + COALESCE((v_p2_init->>'mobility_bonus')::int, 0);
  END IF;
  IF v_p2_main IS NOT NULL AND v_p2_main != 'null'::jsonb THEN
    v_p2_atk := v_p2_atk + COALESCE((v_p2_main->>'attack_bonus')::int, 0);
    v_p2_def := v_p2_def + COALESCE((v_p2_main->>'defense_bonus')::int, 0);
    v_p2_mob := v_p2_mob + COALESCE((v_p2_main->>'mobility_bonus')::int, 0);
  END IF;
  
  IF (v_p2_basic->>'attack')::boolean THEN v_p2_atk := v_p2_atk + 1; END IF;
  IF (v_p2_basic->>'defense')::boolean THEN v_p2_def := v_p2_def + 1; END IF;
  IF (v_p2_basic->>'initiative')::boolean THEN v_p2_mob := v_p2_mob + 1; END IF;
  IF (v_p1_basic->>'countermaneuver')::boolean THEN v_p2_mob := v_p2_mob - (v_p2_mob / 2); END IF;
  
  -- Iniciativa
  IF v_p1_mob > v_p2_mob THEN v_init_winner := 1;
  ELSIF v_p2_mob > v_p1_mob THEN v_init_winner := 2;
  ELSE v_init_winner := 0;
  END IF;
  
  -- Calcular dano (ataque - defesa, mínimo 0)
  v_p1_damage := GREATEST(0, v_p2_atk - v_p1_def);
  v_p2_damage := GREATEST(0, v_p1_atk - v_p2_def);
  
  -- Heal básico
  IF (v_p1_basic->>'heal')::boolean THEN v_p1_damage := GREATEST(0, v_p1_damage - 5); END IF;
  IF (v_p2_basic->>'heal')::boolean THEN v_p2_damage := GREATEST(0, v_p2_damage - 5); END IF;
  
  -- Aplicar dano
  v_p1_hp := v_p1_hp - v_p1_damage;
  v_p2_hp := v_p2_hp - v_p2_damage;
  
  -- Verificar fim
  IF v_p1_hp <= 0 OR v_p2_hp <= 0 THEN
    v_combat_finished := true;
    IF v_p1_hp <= 0 AND v_p2_hp <= 0 THEN v_winner := 0;
    ELSIF v_p1_hp <= 0 THEN v_winner := 2;
    ELSE v_winner := 1;
    END IF;
  END IF;
  
  v_resolution := jsonb_build_object(
    'round', v_state.combat_round,
    'p1', jsonb_build_object('atk_final', v_p1_atk, 'def_final', v_p1_def, 'mob_final', v_p1_mob, 'damage_taken', v_p1_damage),
    'p2', jsonb_build_object('atk_final', v_p2_atk, 'def_final', v_p2_def, 'mob_final', v_p2_mob, 'damage_taken', v_p2_damage),
    'initiative_winner', v_init_winner,
    'combat_finished', v_combat_finished,
    'winner', v_winner
  );
  
  v_new_round := v_state.combat_round + 1;
  
  -- Resetar CMD para próxima rodada
  v_p1_cmd_state := COALESCE(v_state.player1_cmd_state, '{}'::jsonb);
  v_p2_cmd_state := COALESCE(v_state.player2_cmd_state, '{}'::jsonb);
  v_p1_cmd_state := jsonb_set(v_p1_cmd_state, '{cmd_spent}', '0'::jsonb);
  v_p1_cmd_state := jsonb_set(v_p1_cmd_state, '{cmd_free}', v_p1_cmd_state->'cmd_total');
  v_p2_cmd_state := jsonb_set(v_p2_cmd_state, '{cmd_spent}', '0'::jsonb);
  v_p2_cmd_state := jsonb_set(v_p2_cmd_state, '{cmd_free}', v_p2_cmd_state->'cmd_total');
  
  -- Preparar próxima rodada (ou fim)
  v_board := jsonb_set(v_board, '{last_resolution}', v_resolution);
  v_board := jsonb_set(v_board, '{step}', '"initiative"'::jsonb);
  v_board := jsonb_set(v_board, '{p1,initiative_card}', 'null'::jsonb);
  v_board := jsonb_set(v_board, '{p1,main_card}', 'null'::jsonb);
  v_board := jsonb_set(v_board, '{p1,confirmed}', 'false'::jsonb);
  v_board := jsonb_set(v_board, '{p1,basic_bonuses}', '{}'::jsonb);
  v_board := jsonb_set(v_board, '{p2,initiative_card}', 'null'::jsonb);
  v_board := jsonb_set(v_board, '{p2,main_card}', 'null'::jsonb);
  v_board := jsonb_set(v_board, '{p2,confirmed}', 'false'::jsonb);
  v_board := jsonb_set(v_board, '{p2,basic_bonuses}', '{}'::jsonb);
  
  UPDATE public.match_state SET
    player1_hp = v_p1_hp,
    player2_hp = v_p2_hp,
    combat_round = v_new_round,
    combat_phase = CASE WHEN v_combat_finished THEN 'finished' ELSE 'initiative' END,
    combat_board_state = v_board,
    player1_cmd_state = v_p1_cmd_state,
    player2_cmd_state = v_p2_cmd_state,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  IF v_combat_finished THEN
    UPDATE public.rooms SET current_phase = 'resolution', status = 'finished', updated_at = now() WHERE id = p_room_id;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) 
  VALUES (p_room_id, 0, 'resolve_combat_round', v_resolution, 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'resolution', v_resolution);
END;
$$;