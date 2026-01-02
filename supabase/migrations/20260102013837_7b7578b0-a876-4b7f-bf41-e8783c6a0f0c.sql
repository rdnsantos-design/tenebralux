-- Fix VET spent calculation to support deck arrays storing UUID strings
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

  -- Cards can be stored as either:
  -- 1) UUID strings ("<uuid>")  [current UI]
  -- 2) objects { id: <uuid>, vet_cost?: <int>, ... }
  FOR v_card_elem IN
    (SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'offensive', '[]'::jsonb))
     UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'defensive', '[]'::jsonb))
     UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'initiative', '[]'::jsonb))
     UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'reactions', '[]'::jsonb)))
  LOOP
    -- If element is an object and already carries vet_cost, use it
    IF jsonb_typeof(v_card_elem) = 'object' AND (v_card_elem ? 'vet_cost') THEN
      v_card_cost := v_card_cost + COALESCE((v_card_elem->>'vet_cost')::integer, 0);
      CONTINUE;
    END IF;

    -- Extract card id
    IF jsonb_typeof(v_card_elem) = 'string' THEN
      v_elem_text := trim(both '"' from v_card_elem::text);
      v_card_id := v_elem_text::uuid;
    ELSIF jsonb_typeof(v_card_elem) = 'object' THEN
      v_card_id := (v_card_elem->>'id')::uuid;
    ELSE
      v_card_id := NULL;
    END IF;

    IF v_card_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(vet_cost_override, vet_cost, 0) INTO v_card_vet
    FROM public.mass_combat_tactical_cards
    WHERE id = v_card_id;

    v_card_cost := v_card_cost + COALESCE(v_card_vet, 0);
  END LOOP;

  RETURN v_attr_cost + v_cmd_cost + v_card_cost;
END;
$$;

-- Fix get_vet_status: budget must be playerX_vet_budget (post-logistics), not playerX_vet_remaining
CREATE OR REPLACE FUNCTION public.get_vet_status(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_vet_budget INTEGER;
  v_vet_spent INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);

  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;

  IF v_player_number = 1 THEN
    v_vet_budget := COALESCE(v_state.player1_vet_budget, 0);
  ELSE
    v_vet_budget := COALESCE(v_state.player2_vet_budget, 0);
  END IF;

  v_vet_spent := public.calc_player_vet_spent(p_room_id, v_player_number);

  RETURN jsonb_build_object(
    'budget', v_vet_budget,
    'spent', v_vet_spent,
    'remaining', GREATEST(v_vet_budget - v_vet_spent, 0)
  );
END;
$$;