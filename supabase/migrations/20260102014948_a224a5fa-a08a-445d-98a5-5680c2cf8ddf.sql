-- =============================================
-- MAJOR REFACTOR: Commander Instances + Deck Objects + VET Consistency
-- =============================================

-- 1) Create get_match_state RPC for complete export with budget/spent/remaining
CREATE OR REPLACE FUNCTION public.get_match_state(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_state RECORD;
  v_room RECORD;
  v_p1_spent INTEGER;
  v_p2_spent INTEGER;
  v_terrain RECORD;
  v_season RECORD;
  v_logistics_summary JSONB;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RETURN jsonb_build_object('error', 'Match state not found');
  END IF;
  
  -- Calculate spent for both players
  v_p1_spent := public.calc_player_vet_spent(p_room_id, 1);
  v_p2_spent := public.calc_player_vet_spent(p_room_id, 2);
  
  -- Get terrain/season names
  SELECT name INTO v_terrain FROM public.mass_combat_primary_terrains WHERE id = v_state.chosen_terrain_id;
  SELECT name INTO v_season FROM public.mass_combat_seasons WHERE id = v_state.chosen_season_id;
  
  -- Build logistics summary from match_actions
  SELECT jsonb_build_object(
    'options', v_state.scenario_options,
    'chosen_terrain', jsonb_build_object('id', v_state.chosen_terrain_id, 'name', v_terrain.name),
    'chosen_season', jsonb_build_object('id', v_state.chosen_season_id, 'name', v_season.name),
    'vet_cost_logistics_p1', v_state.vet_cost_logistics_p1,
    'vet_cost_logistics_p2', v_state.vet_cost_logistics_p2
  ) INTO v_logistics_summary;
  
  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'code', v_room.code,
      'status', v_room.status,
      'current_phase', v_room.current_phase
    ),
    'match_state', jsonb_build_object(
      'version', v_state.version,
      'vet_agreed', v_state.vet_agreed,
      'logistics_resolved', v_state.logistics_resolved,
      'logistics_summary', v_logistics_summary,
      'player1', jsonb_build_object(
        'culture', v_state.player1_culture,
        'culture_confirmed', v_state.player1_culture_confirmed,
        'vet_budget', COALESCE(v_state.player1_vet_budget, 0),
        'vet_spent', v_p1_spent,
        'vet_remaining', GREATEST(COALESCE(v_state.player1_vet_budget, 0) - v_p1_spent, 0),
        'army_attributes', v_state.player1_army_attributes,
        'commanders', v_state.player1_commanders,
        'general_id', v_state.player1_general_id,
        'deck', v_state.player1_deck,
        'deck_confirmed', v_state.player1_deck_confirmed
      ),
      'player2', jsonb_build_object(
        'culture', v_state.player2_culture,
        'culture_confirmed', v_state.player2_culture_confirmed,
        'vet_budget', COALESCE(v_state.player2_vet_budget, 0),
        'vet_spent', v_p2_spent,
        'vet_remaining', GREATEST(COALESCE(v_state.player2_vet_budget, 0) - v_p2_spent, 0),
        'army_attributes', v_state.player2_army_attributes,
        'commanders', v_state.player2_commanders,
        'general_id', v_state.player2_general_id,
        'deck', v_state.player2_deck,
        'deck_confirmed', v_state.player2_deck_confirmed
      )
    )
  );
END;
$$;

-- 2) Refactor add_commander to create instance_id
CREATE OR REPLACE FUNCTION public.add_commander(p_room_id uuid, p_session_id text, p_commander_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_commander RECORD;
  v_commanders jsonb;
  v_commander_count INTEGER;
  v_current_spent INTEGER;
  v_new_spent INTEGER;
  v_vet_budget INTEGER;
  v_new_version INTEGER;
  v_instance_id UUID;
BEGIN
  -- Auth
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  -- Get state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Get commander template
  SELECT * INTO v_commander FROM public.mass_combat_commander_templates WHERE id = p_commander_id;
  IF v_commander IS NULL THEN
    RAISE EXCEPTION 'Comandante não encontrado';
  END IF;
  
  -- Get current commanders and budget
  IF v_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_vet_budget := COALESCE(v_state.player1_vet_budget, 0);
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_vet_budget := COALESCE(v_state.player2_vet_budget, 0);
  END IF;
  
  -- Check 6 commander limit
  v_commander_count := jsonb_array_length(v_commanders);
  IF v_commander_count >= 6 THEN
    RAISE EXCEPTION 'Máximo de 6 comandantes atingido';
  END IF;
  
  -- Check if template already purchased (by template_id)
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_commanders) c 
    WHERE (c->>'template_id')::uuid = p_commander_id
  ) THEN
    RAISE EXCEPTION 'Este template de comandante já foi adquirido';
  END IF;
  
  -- Check VET budget
  v_current_spent := public.calc_player_vet_spent(p_room_id, v_player_number);
  v_new_spent := v_current_spent + v_commander.custo_vet;
  
  IF v_new_spent > v_vet_budget THEN
    RAISE EXCEPTION 'VET insuficiente. Budget: %, Gasto atual: %, Custo do comandante: %', 
      v_vet_budget, v_current_spent, v_commander.custo_vet;
  END IF;
  
  -- Generate instance_id for this commander
  v_instance_id := gen_random_uuid();
  
  -- Add commander with instance_id
  v_commanders := v_commanders || jsonb_build_array(jsonb_build_object(
    'instance_id', v_instance_id,
    'template_id', p_commander_id,
    'numero', v_commander.numero,
    'especializacao', v_commander.especializacao,
    'comando_base', v_commander.comando,
    'estrategia', v_commander.estrategia,
    'guarda_max', v_commander.guarda,
    'guarda_current', v_commander.guarda,
    'custo_vet', v_commander.custo_vet
  ));
  
  -- Save
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_commanders = v_commanders,
      player1_vet_spent = v_new_spent,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_commanders = v_commanders,
      player2_vet_spent = v_new_spent,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'add_commander', 
    jsonb_build_object(
      'instance_id', v_instance_id,
      'template_id', p_commander_id, 
      'custo_vet', v_commander.custo_vet
    ), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'instance_id', v_instance_id,
    'commander_count', v_commander_count + 1,
    'vet_spent', v_new_spent,
    'vet_remaining', v_vet_budget - v_new_spent
  );
END;
$$;

-- 3) Refactor remove_commander to use instance_id
CREATE OR REPLACE FUNCTION public.remove_commander(p_room_id uuid, p_session_id text, p_commander_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_commanders jsonb;
  v_general_id uuid;
  v_new_commanders jsonb := '[]'::jsonb;
  v_elem jsonb;
  v_removed_cost INTEGER := 0;
  v_new_spent INTEGER;
  v_vet_budget INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Auth
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  -- Get state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Get current commanders and general
  IF v_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_general_id := v_state.player1_general_id;
    v_vet_budget := COALESCE(v_state.player1_vet_budget, 0);
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_general_id := v_state.player2_general_id;
    v_vet_budget := COALESCE(v_state.player2_vet_budget, 0);
  END IF;
  
  -- Remove commander by instance_id (or template_id for backwards compat)
  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_commanders)
  LOOP
    IF COALESCE((v_elem->>'instance_id')::uuid, (v_elem->>'id')::uuid) = p_commander_id 
       OR (v_elem->>'template_id')::uuid = p_commander_id THEN
      v_removed_cost := COALESCE((v_elem->>'custo_vet')::integer, 0);
      -- If this was the general, clear it
      IF v_general_id = COALESCE((v_elem->>'instance_id')::uuid, (v_elem->>'id')::uuid, p_commander_id) THEN
        v_general_id := NULL;
      END IF;
    ELSE
      v_new_commanders := v_new_commanders || jsonb_build_array(v_elem);
    END IF;
  END LOOP;
  
  -- Calculate new spent
  v_new_spent := public.calc_player_vet_spent(p_room_id, v_player_number) - v_removed_cost;
  
  -- Save
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_commanders = v_new_commanders,
      player1_general_id = v_general_id,
      player1_vet_spent = GREATEST(v_new_spent, 0),
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_commanders = v_new_commanders,
      player2_general_id = v_general_id,
      player2_vet_spent = GREATEST(v_new_spent, 0),
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'remove_commander', 
    jsonb_build_object('commander_id', p_commander_id, 'cost_returned', v_removed_cost), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'general_cleared', v_general_id IS NULL,
    'vet_spent', GREATEST(v_new_spent, 0),
    'vet_remaining', v_vet_budget - GREATEST(v_new_spent, 0)
  );
END;
$$;

-- 4) Refactor set_general to use instance_id
CREATE OR REPLACE FUNCTION public.set_general(p_room_id uuid, p_session_id text, p_commander_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_commanders jsonb;
  v_found BOOLEAN := false;
  v_instance_id UUID;
  v_elem jsonb;
  v_new_version INTEGER;
BEGIN
  -- Auth
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  -- Get state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Get current commanders
  IF v_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
  END IF;
  
  -- Find commander by instance_id or template_id or old id
  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_commanders)
  LOOP
    v_instance_id := COALESCE(
      (v_elem->>'instance_id')::uuid, 
      (v_elem->>'id')::uuid
    );
    IF v_instance_id = p_commander_id OR (v_elem->>'template_id')::uuid = p_commander_id THEN
      v_found := true;
      EXIT;
    END IF;
  END LOOP;
  
  IF NOT v_found THEN
    RAISE EXCEPTION 'Comandante não está no seu exército';
  END IF;
  
  -- Save (use instance_id for reference)
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_general_id = v_instance_id,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_general_id = v_instance_id,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'set_general', 
    jsonb_build_object('instance_id', v_instance_id), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'general_instance_id', v_instance_id);
END;
$$;

-- 5) Refactor add_card_to_deck to store full card objects
CREATE OR REPLACE FUNCTION public.add_card_to_deck(p_room_id uuid, p_session_id text, p_card_id uuid, p_category text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_card RECORD;
  v_deck jsonb;
  v_category_cards jsonb;
  v_category_count INTEGER;
  v_limit INTEGER;
  v_attack INTEGER;
  v_defense INTEGER;
  v_mobility INTEGER;
  v_current_spent INTEGER;
  v_card_cost INTEGER;
  v_new_spent INTEGER;
  v_vet_budget INTEGER;
  v_new_version INTEGER;
  v_all_card_ids TEXT[];
  v_elem jsonb;
BEGIN
  -- Auth
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  -- Get state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Get card from DB
  SELECT * INTO v_card FROM public.mass_combat_tactical_cards WHERE id = p_card_id;
  IF v_card IS NULL THEN
    RAISE EXCEPTION 'Carta não encontrada';
  END IF;
  
  -- Validate category
  IF p_category NOT IN ('offensive', 'defensive', 'initiative', 'reactions') THEN
    RAISE EXCEPTION 'Categoria inválida: %', p_category;
  END IF;
  
  -- Get deck and attributes
  IF v_player_number = 1 THEN
    v_deck := COALESCE(v_state.player1_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
    v_vet_budget := COALESCE(v_state.player1_vet_budget, 0);
    v_attack := COALESCE((v_state.player1_army_attributes->>'attack')::integer, 0);
    v_defense := COALESCE((v_state.player1_army_attributes->>'defense')::integer, 0);
    v_mobility := COALESCE((v_state.player1_army_attributes->>'mobility')::integer, 0);
  ELSE
    v_deck := COALESCE(v_state.player2_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
    v_vet_budget := COALESCE(v_state.player2_vet_budget, 0);
    v_attack := COALESCE((v_state.player2_army_attributes->>'attack')::integer, 0);
    v_defense := COALESCE((v_state.player2_army_attributes->>'defense')::integer, 0);
    v_mobility := COALESCE((v_state.player2_army_attributes->>'mobility')::integer, 0);
  END IF;
  
  -- Set limit based on category
  CASE p_category
    WHEN 'offensive' THEN v_limit := v_attack;
    WHEN 'defensive' THEN v_limit := v_defense;
    WHEN 'initiative' THEN v_limit := v_mobility;
    WHEN 'reactions' THEN v_limit := v_mobility * 2;
  END CASE;
  
  -- Get cards in category
  v_category_cards := COALESCE(v_deck->p_category, '[]'::jsonb);
  v_category_count := jsonb_array_length(v_category_cards);
  
  -- Check limit
  IF v_category_count >= v_limit THEN
    RAISE EXCEPTION 'Limite de % cartas % atingido (limite baseado no atributo)', v_limit, p_category;
  END IF;
  
  -- Check 1 copy rule across ALL categories
  v_all_card_ids := ARRAY[]::TEXT[];
  FOR v_elem IN 
    SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'offensive', '[]'::jsonb))
    UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'defensive', '[]'::jsonb))
    UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'initiative', '[]'::jsonb))
    UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'reactions', '[]'::jsonb))
  LOOP
    -- Handle both string IDs and object {card_id: ...}
    IF jsonb_typeof(v_elem) = 'string' THEN
      v_all_card_ids := array_append(v_all_card_ids, trim(both '"' from v_elem::text));
    ELSIF jsonb_typeof(v_elem) = 'object' THEN
      v_all_card_ids := array_append(v_all_card_ids, COALESCE(v_elem->>'card_id', v_elem->>'id'));
    END IF;
  END LOOP;
  
  IF p_card_id::text = ANY(v_all_card_ids) THEN
    RAISE EXCEPTION 'Carta já está no deck (máximo 1 cópia por carta)';
  END IF;
  
  -- Calculate cost
  v_card_cost := COALESCE(v_card.vet_cost_override, v_card.vet_cost, 0);
  v_current_spent := public.calc_player_vet_spent(p_room_id, v_player_number);
  v_new_spent := v_current_spent + v_card_cost;
  
  IF v_new_spent > v_vet_budget THEN
    RAISE EXCEPTION 'VET insuficiente. Budget: %, Gasto atual: %, Custo da carta: %', 
      v_vet_budget, v_current_spent, v_card_cost;
  END IF;
  
  -- Add card as OBJECT with full data
  v_category_cards := v_category_cards || jsonb_build_array(jsonb_build_object(
    'card_id', p_card_id,
    'name', v_card.name,
    'vet_cost', v_card_cost,
    'unit_type', v_card.unit_type,
    'command_required', v_card.command_required,
    'strategy_required', v_card.strategy_required,
    'culture', v_card.culture,
    'effect_tag', v_card.effect_tag,
    'attack_bonus', v_card.attack_bonus,
    'defense_bonus', v_card.defense_bonus,
    'mobility_bonus', v_card.mobility_bonus,
    'description', v_card.description
  ));
  
  v_deck := jsonb_set(v_deck, ARRAY[p_category], v_category_cards);
  
  -- Save
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_deck = v_deck,
      player1_vet_spent = v_new_spent,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_deck = v_deck,
      player2_vet_spent = v_new_spent,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'add_card', 
    jsonb_build_object('card_id', p_card_id, 'name', v_card.name, 'category', p_category, 'vet_cost', v_card_cost), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'category_count', v_category_count + 1,
    'category_limit', v_limit,
    'vet_spent', v_new_spent,
    'vet_remaining', v_vet_budget - v_new_spent
  );
END;
$$;

-- 6) Refactor remove_card_from_deck to handle objects
CREATE OR REPLACE FUNCTION public.remove_card_from_deck(p_room_id uuid, p_session_id text, p_card_id uuid, p_category text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_deck jsonb;
  v_category_cards jsonb;
  v_new_cards jsonb := '[]'::jsonb;
  v_elem jsonb;
  v_removed_cost INTEGER := 0;
  v_new_spent INTEGER;
  v_vet_budget INTEGER;
  v_new_version INTEGER;
  v_elem_id TEXT;
BEGIN
  -- Auth
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  -- Get state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Get deck
  IF v_player_number = 1 THEN
    v_deck := COALESCE(v_state.player1_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
    v_vet_budget := COALESCE(v_state.player1_vet_budget, 0);
  ELSE
    v_deck := COALESCE(v_state.player2_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
    v_vet_budget := COALESCE(v_state.player2_vet_budget, 0);
  END IF;
  
  -- Get cards in category
  v_category_cards := COALESCE(v_deck->p_category, '[]'::jsonb);
  
  -- Remove card (handle both string IDs and objects)
  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_category_cards)
  LOOP
    IF jsonb_typeof(v_elem) = 'string' THEN
      v_elem_id := trim(both '"' from v_elem::text);
    ELSIF jsonb_typeof(v_elem) = 'object' THEN
      v_elem_id := COALESCE(v_elem->>'card_id', v_elem->>'id');
    ELSE
      v_elem_id := NULL;
    END IF;
    
    IF v_elem_id = p_card_id::text THEN
      -- Get cost being removed
      IF jsonb_typeof(v_elem) = 'object' AND (v_elem ? 'vet_cost') THEN
        v_removed_cost := COALESCE((v_elem->>'vet_cost')::integer, 0);
      ELSE
        -- Look up from DB
        SELECT COALESCE(vet_cost_override, vet_cost, 0) INTO v_removed_cost
        FROM public.mass_combat_tactical_cards WHERE id = p_card_id;
      END IF;
    ELSE
      v_new_cards := v_new_cards || jsonb_build_array(v_elem);
    END IF;
  END LOOP;
  
  v_deck := jsonb_set(v_deck, ARRAY[p_category], v_new_cards);
  
  -- Calculate new spent
  v_new_spent := public.calc_player_vet_spent(p_room_id, v_player_number) - v_removed_cost;
  
  -- Save
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_deck = v_deck,
      player1_vet_spent = GREATEST(v_new_spent, 0),
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_deck = v_deck,
      player2_vet_spent = GREATEST(v_new_spent, 0),
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'remove_card', 
    jsonb_build_object('card_id', p_card_id, 'category', p_category, 'cost_returned', v_removed_cost), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'vet_spent', GREATEST(v_new_spent, 0),
    'vet_remaining', v_vet_budget - GREATEST(v_new_spent, 0)
  );
END;
$$;

-- 7) Update calc_player_vet_spent to handle new commander structure
CREATE OR REPLACE FUNCTION public.calc_player_vet_spent(p_room_id uuid, p_player_number integer)
RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_state RECORD;
  v_attributes JSONB;
  v_commanders JSONB;
  v_deck JSONB;
  v_attr_cost INTEGER := 0;
  v_cmd_cost INTEGER := 0;
  v_card_cost INTEGER := 0;
  v_card_elem JSONB;
  v_card_id UUID;
  v_card_vet INTEGER;
  v_elem_text TEXT;
BEGIN
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RETURN 0;
  END IF;

  IF p_player_number = 1 THEN
    v_attributes := COALESCE(v_state.player1_army_attributes, '{"attack":0,"defense":0,"mobility":0}'::jsonb);
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_deck := COALESCE(v_state.player1_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
  ELSE
    v_attributes := COALESCE(v_state.player2_army_attributes, '{"attack":0,"defense":0,"mobility":0}'::jsonb);
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_deck := COALESCE(v_state.player2_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
  END IF;

  -- Attributes: (attack + defense + mobility) * 5
  v_attr_cost := (
    COALESCE((v_attributes->>'attack')::integer, 0) +
    COALESCE((v_attributes->>'defense')::integer, 0) +
    COALESCE((v_attributes->>'mobility')::integer, 0)
  ) * 5;

  -- Commanders: SUM(custo_vet) from stored commander objects
  SELECT COALESCE(SUM((c->>'custo_vet')::integer), 0) INTO v_cmd_cost
  FROM jsonb_array_elements(v_commanders) c;

  -- Cards: iterate through all categories
  FOR v_card_elem IN
    (SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'offensive', '[]'::jsonb))
     UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'defensive', '[]'::jsonb))
     UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'initiative', '[]'::jsonb))
     UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'reactions', '[]'::jsonb)))
  LOOP
    -- If element is an object with vet_cost, use it directly
    IF jsonb_typeof(v_card_elem) = 'object' AND (v_card_elem ? 'vet_cost') THEN
      v_card_cost := v_card_cost + COALESCE((v_card_elem->>'vet_cost')::integer, 0);
      CONTINUE;
    END IF;

    -- Extract card id (for legacy string-only entries or objects without vet_cost)
    IF jsonb_typeof(v_card_elem) = 'string' THEN
      v_elem_text := trim(both '"' from v_card_elem::text);
      v_card_id := v_elem_text::uuid;
    ELSIF jsonb_typeof(v_card_elem) = 'object' THEN
      v_card_id := COALESCE((v_card_elem->>'card_id')::uuid, (v_card_elem->>'id')::uuid);
    ELSE
      v_card_id := NULL;
    END IF;

    IF v_card_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Look up cost from DB
    SELECT COALESCE(vet_cost_override, vet_cost, 0) INTO v_card_vet
    FROM public.mass_combat_tactical_cards
    WHERE id = v_card_id;

    v_card_cost := v_card_cost + COALESCE(v_card_vet, 0);
  END LOOP;

  RETURN v_attr_cost + v_cmd_cost + v_card_cost;
END;
$$;

-- 8) Update set_army_attributes to maintain vet_spent consistency
CREATE OR REPLACE FUNCTION public.set_army_attributes(p_room_id uuid, p_session_id text, p_attack integer, p_defense integer, p_mobility integer)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_new_attr_cost INTEGER;
  v_current_spent INTEGER;
  v_vet_budget INTEGER;
  v_old_attr_cost INTEGER;
  v_new_spent INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Auth
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  -- Get state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Validate values
  IF p_attack < 0 OR p_defense < 0 OR p_mobility < 0 THEN
    RAISE EXCEPTION 'Atributos não podem ser negativos';
  END IF;
  
  -- Calculate new attributes cost
  v_new_attr_cost := (p_attack + p_defense + p_mobility) * 5;
  
  -- Get budget and old attr cost
  IF v_player_number = 1 THEN
    v_vet_budget := COALESCE(v_state.player1_vet_budget, 0);
    v_old_attr_cost := (
      COALESCE((v_state.player1_army_attributes->>'attack')::integer, 0) +
      COALESCE((v_state.player1_army_attributes->>'defense')::integer, 0) +
      COALESCE((v_state.player1_army_attributes->>'mobility')::integer, 0)
    ) * 5;
  ELSE
    v_vet_budget := COALESCE(v_state.player2_vet_budget, 0);
    v_old_attr_cost := (
      COALESCE((v_state.player2_army_attributes->>'attack')::integer, 0) +
      COALESCE((v_state.player2_army_attributes->>'defense')::integer, 0) +
      COALESCE((v_state.player2_army_attributes->>'mobility')::integer, 0)
    ) * 5;
  END IF;
  
  -- Calculate current spent and project new spent
  v_current_spent := public.calc_player_vet_spent(p_room_id, v_player_number);
  v_new_spent := v_current_spent - v_old_attr_cost + v_new_attr_cost;
  
  -- Validate budget
  IF v_new_spent > v_vet_budget THEN
    RAISE EXCEPTION 'VET insuficiente. Budget: %, Novo gasto total: %', v_vet_budget, v_new_spent;
  END IF;
  
  -- Save attributes and update spent
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_army_attributes = jsonb_build_object('attack', p_attack, 'defense', p_defense, 'mobility', p_mobility),
      player1_vet_spent = v_new_spent,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_army_attributes = jsonb_build_object('attack', p_attack, 'defense', p_defense, 'mobility', p_mobility),
      player2_vet_spent = v_new_spent,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'set_attributes', 
    jsonb_build_object('attack', p_attack, 'defense', p_defense, 'mobility', p_mobility, 'cost', v_new_attr_cost), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'vet_spent', v_new_spent,
    'vet_remaining', v_vet_budget - v_new_spent
  );
END;
$$;

-- 9) Update confirm_deckbuilding to use instance_id for general
CREATE OR REPLACE FUNCTION public.confirm_deckbuilding(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
  
  -- Verify general is in commanders list (by instance_id or legacy id)
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_commanders) c 
    WHERE COALESCE((c->>'instance_id')::uuid, (c->>'id')::uuid) = v_general_id
  ) THEN
    RAISE EXCEPTION 'O General selecionado não está na lista de comandantes';
  END IF;
  
  -- Calculate final spent
  v_final_spent := public.calc_player_vet_spent(p_room_id, v_player_number);
  
  -- Validate budget not exceeded
  IF v_final_spent > v_vet_budget THEN
    RAISE EXCEPTION 'Orçamento VET excedido. Budget: %, Gasto: %', v_vet_budget, v_final_spent;
  END IF;
  
  -- Confirm
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_deck_confirmed = true,
      player1_vet_spent = v_final_spent,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_deck_confirmed = true,
      player2_vet_spent = v_final_spent,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Log action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'confirm_deckbuilding', 
    jsonb_build_object(
      'commanders_count', jsonb_array_length(v_commanders), 
      'general_id', v_general_id,
      'final_vet_spent', v_final_spent,
      'vet_remaining', v_vet_budget - v_final_spent
    ), 
    'deckbuilding', v_new_version);
  
  -- Check if both confirmed
  SELECT (player1_deck_confirmed AND player2_deck_confirmed) INTO v_both_confirmed
  FROM public.match_state
  WHERE room_id = p_room_id;
  
  -- If both confirmed, advance to combat_setup
  IF v_both_confirmed THEN
    UPDATE public.rooms
    SET current_phase = 'combat_setup', updated_at = now()
    WHERE id = p_room_id;
    
    UPDATE public.match_state
    SET version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 0, 'phase_advance', jsonb_build_object('new_phase', 'combat_setup'), 'deckbuilding', v_new_version);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version, 
    'both_confirmed', v_both_confirmed,
    'final_vet_spent', v_final_spent,
    'vet_remaining', v_vet_budget - v_final_spent
  );
END;
$$;