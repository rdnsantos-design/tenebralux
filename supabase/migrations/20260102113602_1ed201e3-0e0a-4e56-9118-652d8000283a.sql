-- =====================================================
-- FASE 4 & 5: COMBAT_SETUP + COMBAT LOOP MVP
-- =====================================================

-- 1) Add 'combat_setup' and 'combat' to game_phase enum if not exists
DO $$ 
BEGIN
  -- Check and add combat_setup
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'game_phase'::regtype AND enumlabel = 'combat_setup') THEN
    ALTER TYPE game_phase ADD VALUE 'combat_setup';
  END IF;
  
  -- Check and add combat (may already exist)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'game_phase'::regtype AND enumlabel = 'combat') THEN
    ALTER TYPE game_phase ADD VALUE 'combat';
  END IF;
END $$;

-- 2) Add combat columns to match_state
ALTER TABLE public.match_state
  ADD COLUMN IF NOT EXISTS combat_round integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS combat_phase text DEFAULT 'pre_combat',
  ADD COLUMN IF NOT EXISTS player1_hand jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS player2_hand jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS player1_discard jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS player2_discard jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS player1_basic_cards_state jsonb DEFAULT '{"attack":false,"defense":false,"initiative":false,"heal":false,"countermaneuver":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS player2_basic_cards_state jsonb DEFAULT '{"attack":false,"defense":false,"initiative":false,"heal":false,"countermaneuver":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS player1_cmd_state jsonb DEFAULT '{"commanders":{},"general":{"cmd_total":0,"cmd_spent":0,"cmd_free":0}}'::jsonb,
  ADD COLUMN IF NOT EXISTS player2_cmd_state jsonb DEFAULT '{"commanders":{},"general":{"cmd_total":0,"cmd_spent":0,"cmd_free":0}}'::jsonb,
  ADD COLUMN IF NOT EXISTS player1_hp integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS player2_hp integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS player1_deployment_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS player2_deployment_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS combat_board_state jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS current_action_stack jsonb DEFAULT '[]'::jsonb;

-- 3) RPC: start_combat - transitions from deckbuilding to combat_setup
CREATE OR REPLACE FUNCTION public.start_combat(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_room RECORD;
  v_new_version INTEGER;
  v_p1_cmd_state jsonb;
  v_p2_cmd_state jsonb;
  v_p1_hand jsonb;
  v_p2_hand jsonb;
  v_commander jsonb;
  v_cmd_total INTEGER;
BEGIN
  -- Get current state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  IF v_room.current_phase != 'deckbuilding' THEN
    RAISE EXCEPTION 'Jogo não está na fase de deckbuilding';
  END IF;
  
  -- Validate both players confirmed deckbuilding
  IF NOT v_state.player1_deck_confirmed OR NOT v_state.player2_deck_confirmed THEN
    RAISE EXCEPTION 'Ambos jogadores precisam confirmar o deckbuilding';
  END IF;
  
  -- Validate both have a general
  IF v_state.player1_general_id IS NULL OR v_state.player2_general_id IS NULL THEN
    RAISE EXCEPTION 'Ambos jogadores precisam ter um General definido';
  END IF;
  
  -- Build CMD state for player 1
  v_p1_cmd_state := '{"commanders":{}, "general":{"cmd_total":0,"cmd_spent":0,"cmd_free":0}}'::jsonb;
  FOR v_commander IN SELECT * FROM jsonb_array_elements(v_state.player1_commanders)
  LOOP
    v_cmd_total := COALESCE((v_commander->>'comando_base')::integer, (v_commander->>'comando')::integer, 1);
    v_p1_cmd_state := jsonb_set(
      v_p1_cmd_state,
      ARRAY['commanders', COALESCE(v_commander->>'instance_id', v_commander->>'id')],
      jsonb_build_object('cmd_total', v_cmd_total, 'cmd_spent', 0, 'cmd_free', v_cmd_total)
    );
    
    -- If this is the general, also set general CMD
    IF (v_commander->>'instance_id' = v_state.player1_general_id::text OR v_commander->>'id' = v_state.player1_general_id::text) THEN
      v_p1_cmd_state := jsonb_set(v_p1_cmd_state, '{general}', 
        jsonb_build_object('cmd_total', v_cmd_total, 'cmd_spent', 0, 'cmd_free', v_cmd_total)
      );
    END IF;
  END LOOP;
  
  -- Build CMD state for player 2
  v_p2_cmd_state := '{"commanders":{}, "general":{"cmd_total":0,"cmd_spent":0,"cmd_free":0}}'::jsonb;
  FOR v_commander IN SELECT * FROM jsonb_array_elements(v_state.player2_commanders)
  LOOP
    v_cmd_total := COALESCE((v_commander->>'comando_base')::integer, (v_commander->>'comando')::integer, 1);
    v_p2_cmd_state := jsonb_set(
      v_p2_cmd_state,
      ARRAY['commanders', COALESCE(v_commander->>'instance_id', v_commander->>'id')],
      jsonb_build_object('cmd_total', v_cmd_total, 'cmd_spent', 0, 'cmd_free', v_cmd_total)
    );
    
    -- If this is the general, also set general CMD
    IF (v_commander->>'instance_id' = v_state.player2_general_id::text OR v_commander->>'id' = v_state.player2_general_id::text) THEN
      v_p2_cmd_state := jsonb_set(v_p2_cmd_state, '{general}', 
        jsonb_build_object('cmd_total', v_cmd_total, 'cmd_spent', 0, 'cmd_free', v_cmd_total)
      );
    END IF;
  END LOOP;
  
  -- Copy deck cards to hand (initial draw)
  v_p1_hand := COALESCE(v_state.player1_deck->'offensive', '[]'::jsonb) ||
               COALESCE(v_state.player1_deck->'defensive', '[]'::jsonb) ||
               COALESCE(v_state.player1_deck->'initiative', '[]'::jsonb);
  
  v_p2_hand := COALESCE(v_state.player2_deck->'offensive', '[]'::jsonb) ||
               COALESCE(v_state.player2_deck->'defensive', '[]'::jsonb) ||
               COALESCE(v_state.player2_deck->'initiative', '[]'::jsonb);
  
  -- Update match state
  UPDATE public.match_state
  SET 
    combat_round = 1,
    combat_phase = 'deployment',
    player1_hand = v_p1_hand,
    player2_hand = v_p2_hand,
    player1_discard = '[]'::jsonb,
    player2_discard = '[]'::jsonb,
    player1_basic_cards_state = '{"attack":false,"defense":false,"initiative":false,"heal":false,"countermaneuver":false}'::jsonb,
    player2_basic_cards_state = '{"attack":false,"defense":false,"initiative":false,"heal":false,"countermaneuver":false}'::jsonb,
    player1_cmd_state = v_p1_cmd_state,
    player2_cmd_state = v_p2_cmd_state,
    player1_hp = 100,
    player2_hp = 100,
    player1_deployment_confirmed = false,
    player2_deployment_confirmed = false,
    player1_basic_cards_granted = true,
    player2_basic_cards_granted = true,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Advance room phase
  UPDATE public.rooms
  SET current_phase = 'combat_setup', updated_at = now()
  WHERE id = p_room_id;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'start_combat', jsonb_build_object(
    'player1_hand_count', jsonb_array_length(v_p1_hand),
    'player2_hand_count', jsonb_array_length(v_p2_hand)
  ), 'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true,
    'version', v_new_version,
    'combat_phase', 'deployment'
  );
END;
$function$;

-- 4) RPC: confirm_deployment - player confirms combat setup
CREATE OR REPLACE FUNCTION public.confirm_deployment(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_both_confirmed BOOLEAN;
  v_new_version INTEGER;
BEGIN
  -- Get player number
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  IF v_player_number IS NULL THEN
    RAISE EXCEPTION 'Jogador não encontrado na sala';
  END IF;
  
  -- Get state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Update deployment confirmation
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET player1_deployment_confirmed = true, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET player2_deployment_confirmed = true, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'confirm_deployment', '{}'::jsonb, 'combat_setup', v_new_version);
  
  -- Check if both confirmed
  SELECT (player1_deployment_confirmed AND player2_deployment_confirmed) INTO v_both_confirmed
  FROM public.match_state WHERE room_id = p_room_id;
  
  -- If both confirmed, start combat
  IF v_both_confirmed THEN
    UPDATE public.match_state
    SET combat_phase = 'initiative', version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
    
    UPDATE public.rooms
    SET current_phase = 'combat', updated_at = now()
    WHERE id = p_room_id;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 0, 'start_combat_round', jsonb_build_object('round', 1), 'combat_setup', v_new_version);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'both_confirmed', v_both_confirmed);
END;
$function$;

-- 5) RPC: advance_combat_phase - move to next phase within a round
CREATE OR REPLACE FUNCTION public.advance_combat_phase(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_new_phase TEXT;
  v_new_round INTEGER;
  v_new_version INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  IF v_player_number IS NULL THEN
    RAISE EXCEPTION 'Jogador não encontrado';
  END IF;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  -- Determine next phase
  v_new_round := v_state.combat_round;
  CASE v_state.combat_phase
    WHEN 'initiative' THEN v_new_phase := 'actions';
    WHEN 'actions' THEN v_new_phase := 'resolve';
    WHEN 'resolve' THEN v_new_phase := 'end_round';
    WHEN 'end_round' THEN 
      v_new_phase := 'initiative';
      v_new_round := v_state.combat_round + 1;
      -- Reset CMD for new round
      UPDATE public.match_state
      SET 
        player1_cmd_state = jsonb_set(player1_cmd_state, '{general,cmd_spent}', '0'),
        player2_cmd_state = jsonb_set(player2_cmd_state, '{general,cmd_spent}', '0')
      WHERE room_id = p_room_id;
    ELSE v_new_phase := 'initiative';
  END CASE;
  
  -- Update state
  UPDATE public.match_state
  SET 
    combat_phase = v_new_phase,
    combat_round = v_new_round,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Log
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'advance_phase', 
    jsonb_build_object('from', v_state.combat_phase, 'to', v_new_phase, 'round', v_new_round), 
    'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'phase', v_new_phase, 'round', v_new_round);
END;
$function$;

-- 6) RPC: play_card - play a tactical card from hand
CREATE OR REPLACE FUNCTION public.play_card(p_room_id uuid, p_session_id text, p_card_id text, p_target jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_hand jsonb;
  v_new_hand jsonb := '[]'::jsonb;
  v_discard jsonb;
  v_card jsonb := NULL;
  v_elem jsonb;
  v_card_id TEXT;
  v_new_version INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  IF v_player_number IS NULL THEN
    RAISE EXCEPTION 'Jogador não encontrado';
  END IF;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  -- Get player hand and discard
  IF v_player_number = 1 THEN
    v_hand := v_state.player1_hand;
    v_discard := v_state.player1_discard;
  ELSE
    v_hand := v_state.player2_hand;
    v_discard := v_state.player2_discard;
  END IF;
  
  -- Find card in hand and remove it
  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_hand)
  LOOP
    v_card_id := COALESCE(v_elem->>'card_id', v_elem->>'id');
    IF v_card_id = p_card_id THEN
      v_card := v_elem;
    ELSE
      v_new_hand := v_new_hand || jsonb_build_array(v_elem);
    END IF;
  END LOOP;
  
  IF v_card IS NULL THEN
    RAISE EXCEPTION 'Carta não encontrada na mão';
  END IF;
  
  -- Add to discard
  v_discard := v_discard || jsonb_build_array(v_card);
  
  -- Add to action stack for resolution
  UPDATE public.match_state
  SET 
    current_action_stack = current_action_stack || jsonb_build_array(jsonb_build_object(
      'player', v_player_number,
      'action_type', 'play_card',
      'card', v_card,
      'target', p_target,
      'timestamp', extract(epoch from now())
    )),
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id;
  
  -- Update hand and discard
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET player1_hand = v_new_hand, player1_discard = v_discard, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET player2_hand = v_new_hand, player2_discard = v_discard, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'play_card', 
    jsonb_build_object('card_id', p_card_id, 'card_name', v_card->>'name', 'target', p_target), 
    'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'card_played', v_card);
END;
$function$;

-- 7) RPC: use_basic_card - use one of the 5 basic cards (one-time use)
CREATE OR REPLACE FUNCTION public.use_basic_card(p_room_id uuid, p_session_id text, p_basic_card_key text, p_target jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_basic_state jsonb;
  v_is_used BOOLEAN;
  v_new_version INTEGER;
  v_bonus_type TEXT;
  v_bonus_value INTEGER := 1;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  IF v_player_number IS NULL THEN
    RAISE EXCEPTION 'Jogador não encontrado';
  END IF;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  -- Validate basic card key
  IF p_basic_card_key NOT IN ('attack', 'defense', 'initiative', 'heal', 'countermaneuver') THEN
    RAISE EXCEPTION 'Carta básica inválida: %', p_basic_card_key;
  END IF;
  
  -- Get basic cards state
  IF v_player_number = 1 THEN
    v_basic_state := v_state.player1_basic_cards_state;
  ELSE
    v_basic_state := v_state.player2_basic_cards_state;
  END IF;
  
  -- Check if already used
  v_is_used := (v_basic_state->>p_basic_card_key)::boolean;
  IF v_is_used THEN
    RAISE EXCEPTION 'Carta básica % já foi usada', p_basic_card_key;
  END IF;
  
  -- Mark as used
  v_basic_state := jsonb_set(v_basic_state, ARRAY[p_basic_card_key], 'true'::jsonb);
  
  -- Determine bonus type
  CASE p_basic_card_key
    WHEN 'attack' THEN v_bonus_type := '+1 ATK';
    WHEN 'defense' THEN v_bonus_type := '+1 DEF';
    WHEN 'initiative' THEN v_bonus_type := '+1 INI';
    WHEN 'heal' THEN v_bonus_type := '+1 CURA';
    WHEN 'countermaneuver' THEN v_bonus_type := 'Contra-Manobra';
  END CASE;
  
  -- Add to action stack
  UPDATE public.match_state
  SET current_action_stack = current_action_stack || jsonb_build_array(jsonb_build_object(
    'player', v_player_number,
    'action_type', 'use_basic_card',
    'basic_card', p_basic_card_key,
    'bonus_type', v_bonus_type,
    'target', p_target,
    'timestamp', extract(epoch from now())
  ))
  WHERE room_id = p_room_id;
  
  -- Update state
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET player1_basic_cards_state = v_basic_state, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET player2_basic_cards_state = v_basic_state, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'use_basic_card', 
    jsonb_build_object('basic_card', p_basic_card_key, 'bonus_type', v_bonus_type, 'target', p_target), 
    'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'bonus_applied', v_bonus_type);
END;
$function$;

-- 8) RPC: react_countermaneuver - special reaction using General's CMD
CREATE OR REPLACE FUNCTION public.react_countermaneuver(p_room_id uuid, p_session_id text, p_trigger_action_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_opponent_number INTEGER;
  v_state RECORD;
  v_my_cmd_state jsonb;
  v_opponent_cmd_state jsonb;
  v_my_general_cmd_free INTEGER;
  v_opponent_commander_cmd INTEGER;
  v_basic_state jsonb;
  v_is_used BOOLEAN;
  v_new_version INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  IF v_player_number IS NULL THEN
    RAISE EXCEPTION 'Jogador não encontrado';
  END IF;
  
  v_opponent_number := CASE WHEN v_player_number = 1 THEN 2 ELSE 1 END;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  -- Get CMD states
  IF v_player_number = 1 THEN
    v_my_cmd_state := v_state.player1_cmd_state;
    v_opponent_cmd_state := v_state.player2_cmd_state;
    v_basic_state := v_state.player1_basic_cards_state;
  ELSE
    v_my_cmd_state := v_state.player2_cmd_state;
    v_opponent_cmd_state := v_state.player1_cmd_state;
    v_basic_state := v_state.player2_basic_cards_state;
  END IF;
  
  -- Check if countermaneuver already used
  v_is_used := (v_basic_state->>'countermaneuver')::boolean;
  IF v_is_used THEN
    RAISE EXCEPTION 'Contra-Manobra já foi usada nesta partida';
  END IF;
  
  -- Get my general's free CMD
  v_my_general_cmd_free := (v_my_cmd_state->'general'->>'cmd_free')::integer;
  
  -- For MVP, assume opponent commander CMD = 1 (simplified)
  -- In full version, would lookup from trigger action
  v_opponent_commander_cmd := 1;
  
  -- Validate: my General CMD free >= opponent commander CMD + 1
  IF v_my_general_cmd_free < (v_opponent_commander_cmd + 1) THEN
    RAISE EXCEPTION 'CMD livre do General insuficiente. Necessário: %, Disponível: %', 
      (v_opponent_commander_cmd + 1), v_my_general_cmd_free;
  END IF;
  
  -- Spend CMD from general
  v_my_cmd_state := jsonb_set(
    v_my_cmd_state, 
    '{general,cmd_spent}', 
    to_jsonb((v_my_cmd_state->'general'->>'cmd_spent')::integer + v_opponent_commander_cmd + 1)
  );
  v_my_cmd_state := jsonb_set(
    v_my_cmd_state, 
    '{general,cmd_free}', 
    to_jsonb(v_my_general_cmd_free - v_opponent_commander_cmd - 1)
  );
  
  -- Mark countermaneuver as used
  v_basic_state := jsonb_set(v_basic_state, '{countermaneuver}', 'true'::jsonb);
  
  -- Update state
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_cmd_state = v_my_cmd_state,
      player1_basic_cards_state = v_basic_state,
      current_action_stack = current_action_stack || jsonb_build_array(jsonb_build_object(
        'player', v_player_number,
        'action_type', 'countermaneuver',
        'trigger_action_id', p_trigger_action_id,
        'cmd_spent', v_opponent_commander_cmd + 1,
        'timestamp', extract(epoch from now())
      )),
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_cmd_state = v_my_cmd_state,
      player2_basic_cards_state = v_basic_state,
      current_action_stack = current_action_stack || jsonb_build_array(jsonb_build_object(
        'player', v_player_number,
        'action_type', 'countermaneuver',
        'trigger_action_id', p_trigger_action_id,
        'cmd_spent', v_opponent_commander_cmd + 1,
        'timestamp', extract(epoch from now())
      )),
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'countermaneuver', 
    jsonb_build_object('trigger_action_id', p_trigger_action_id, 'cmd_spent', v_opponent_commander_cmd + 1), 
    'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'cmd_spent', v_opponent_commander_cmd + 1);
END;
$function$;

-- 9) RPC: apply_damage - apply damage to a player's HP (for combat resolution)
CREATE OR REPLACE FUNCTION public.apply_damage(p_room_id uuid, p_target_player integer, p_damage integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_new_hp INTEGER;
  v_new_version INTEGER;
BEGIN
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  IF p_target_player = 1 THEN
    v_new_hp := GREATEST(v_state.player1_hp - p_damage, 0);
    UPDATE public.match_state
    SET player1_hp = v_new_hp, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    v_new_hp := GREATEST(v_state.player2_hp - p_damage, 0);
    UPDATE public.match_state
    SET player2_hp = v_new_hp, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'apply_damage', 
    jsonb_build_object('target_player', p_target_player, 'damage', p_damage, 'new_hp', v_new_hp), 
    'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'new_hp', v_new_hp);
END;
$function$;

-- 10) Update get_match_state to include combat fields
CREATE OR REPLACE FUNCTION public.get_match_state(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_room RECORD;
  v_players JSONB;
  v_recent_actions JSONB;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Sala não encontrada';
  END IF;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  SELECT jsonb_agg(jsonb_build_object(
    'player_number', rp.player_number,
    'nickname', rp.nickname,
    'status', rp.status,
    'is_host', rp.is_host
  )) INTO v_players
  FROM public.room_players rp WHERE rp.room_id = p_room_id;
  
  -- Get recent actions
  SELECT jsonb_agg(a ORDER BY a.created_at DESC) INTO v_recent_actions
  FROM (
    SELECT jsonb_build_object(
      'id', id,
      'player_number', player_number,
      'action_type', action_type,
      'action_data', action_data,
      'phase', phase,
      'state_version', state_version,
      'created_at', created_at
    ) as a, created_at
    FROM public.match_actions
    WHERE room_id = p_room_id
    ORDER BY created_at DESC
    LIMIT 20
  ) sub;
  
  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'code', v_room.code,
      'status', v_room.status,
      'current_phase', v_room.current_phase,
      'host_nickname', v_room.host_nickname,
      'created_at', v_room.created_at,
      'updated_at', v_room.updated_at
    ),
    'players', COALESCE(v_players, '[]'::jsonb),
    'match_state', jsonb_build_object(
      'id', v_state.id,
      'version', v_state.version,
      'game_seed', v_state.game_seed,
      'vet_agreed', v_state.vet_agreed,
      'logistics_budget', v_state.logistics_budget,
      'player1_culture', v_state.player1_culture,
      'player1_culture_confirmed', v_state.player1_culture_confirmed,
      'player2_culture', v_state.player2_culture,
      'player2_culture_confirmed', v_state.player2_culture_confirmed,
      'scenario_options', v_state.scenario_options,
      'logistics_round', v_state.logistics_round,
      'logistics_resolved', v_state.logistics_resolved,
      'player1_round1_bid', v_state.player1_round1_bid,
      'player2_round1_bid', v_state.player2_round1_bid,
      'player1_round2_bid', v_state.player1_round2_bid,
      'player2_round2_bid', v_state.player2_round2_bid,
      'terrain_tiebreak_eligible', v_state.terrain_tiebreak_eligible,
      'season_tiebreak_eligible', v_state.season_tiebreak_eligible,
      'chosen_terrain_id', v_state.chosen_terrain_id,
      'chosen_season_id', v_state.chosen_season_id,
      'vet_cost_logistics_p1', v_state.vet_cost_logistics_p1,
      'vet_cost_logistics_p2', v_state.vet_cost_logistics_p2,
      'player1_vet_budget', v_state.player1_vet_budget,
      'player2_vet_budget', v_state.player2_vet_budget,
      'player1_vet_spent', v_state.player1_vet_spent,
      'player2_vet_spent', v_state.player2_vet_spent,
      'player1_vet_remaining', v_state.player1_vet_remaining,
      'player2_vet_remaining', v_state.player2_vet_remaining,
      'player1_army_attributes', v_state.player1_army_attributes,
      'player2_army_attributes', v_state.player2_army_attributes,
      'player1_commanders', v_state.player1_commanders,
      'player2_commanders', v_state.player2_commanders,
      'player1_general_id', v_state.player1_general_id,
      'player2_general_id', v_state.player2_general_id,
      'player1_deck', v_state.player1_deck,
      'player2_deck', v_state.player2_deck,
      'player1_deck_confirmed', v_state.player1_deck_confirmed,
      'player2_deck_confirmed', v_state.player2_deck_confirmed,
      'player1_basic_cards_granted', v_state.player1_basic_cards_granted,
      'player2_basic_cards_granted', v_state.player2_basic_cards_granted,
      -- Combat fields
      'combat_round', v_state.combat_round,
      'combat_phase', v_state.combat_phase,
      'player1_hand', v_state.player1_hand,
      'player2_hand', v_state.player2_hand,
      'player1_discard', v_state.player1_discard,
      'player2_discard', v_state.player2_discard,
      'player1_basic_cards_state', v_state.player1_basic_cards_state,
      'player2_basic_cards_state', v_state.player2_basic_cards_state,
      'player1_cmd_state', v_state.player1_cmd_state,
      'player2_cmd_state', v_state.player2_cmd_state,
      'player1_hp', v_state.player1_hp,
      'player2_hp', v_state.player2_hp,
      'player1_deployment_confirmed', v_state.player1_deployment_confirmed,
      'player2_deployment_confirmed', v_state.player2_deployment_confirmed,
      'combat_board_state', v_state.combat_board_state,
      'current_action_stack', v_state.current_action_stack,
      'created_at', v_state.created_at,
      'updated_at', v_state.updated_at
    ),
    'recent_actions', COALESCE(v_recent_actions, '[]'::jsonb)
  );
END;
$function$;