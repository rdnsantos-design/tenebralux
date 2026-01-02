-- 1) Add deckbuilding budget/spent tracking fields
ALTER TABLE public.match_state
  ADD COLUMN IF NOT EXISTS vet_cost_logistics_p1 integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vet_cost_logistics_p2 integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player1_vet_budget integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player2_vet_budget integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player1_vet_spent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player2_vet_spent integer NOT NULL DEFAULT 0;

-- Backfill for existing rows (best-effort)
UPDATE public.match_state
SET
  player1_vet_budget = CASE
    WHEN player1_vet_budget = 0 THEN COALESCE(player1_vet_remaining, vet_agreed)
    ELSE player1_vet_budget
  END,
  player2_vet_budget = CASE
    WHEN player2_vet_budget = 0 THEN COALESCE(player2_vet_remaining, vet_agreed)
    ELSE player2_vet_budget
  END,
  player1_vet_spent = COALESCE(player1_vet_spent, 0),
  player2_vet_spent = COALESCE(player2_vet_spent, 0)
WHERE TRUE;

-- 2) Fix/standardize server-side cost calculation
-- Calculates deckbuilding spent as:
-- attributes_cost = (attack+defense+mobility)*5
-- commanders_cost = SUM(custo_vet)
-- cards_cost = SUM(vet_cost)
-- Uses stored card objects in deck arrays when present.
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

  v_attr_cost := (
    COALESCE((v_attributes->>'attack')::integer, 0) +
    COALESCE((v_attributes->>'defense')::integer, 0) +
    COALESCE((v_attributes->>'mobility')::integer, 0)
  ) * 5;

  SELECT COALESCE(SUM((c->>'custo_vet')::integer), 0) INTO v_cmd_cost
  FROM jsonb_array_elements(v_commanders) c;

  -- Cards: expect elements like {id, vet_cost, ...}
  FOR v_card_elem IN
    SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'offensive', '[]'::jsonb))
    UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'defensive', '[]'::jsonb))
    UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'initiative', '[]'::jsonb))
    UNION ALL SELECT * FROM jsonb_array_elements(COALESCE(v_deck->'reactions', '[]'::jsonb))
  LOOP
    -- Prefer stored vet_cost; fallback to DB lookup
    IF (v_card_elem ? 'vet_cost') THEN
      v_card_cost := v_card_cost + COALESCE((v_card_elem->>'vet_cost')::integer, 0);
    ELSE
      v_card_id := (v_card_elem->>'id')::uuid;
      SELECT COALESCE(vet_cost_override, vet_cost, 0) INTO v_card_vet
      FROM public.mass_combat_tactical_cards
      WHERE id = v_card_id;
      v_card_cost := v_card_cost + COALESCE(v_card_vet, 0);
    END IF;
  END LOOP;

  RETURN v_attr_cost + v_cmd_cost + v_card_cost;
END;
$$;

-- Helper to recalc & persist spent/remaining (keeps legacy playerX_vet_remaining consistent)
CREATE OR REPLACE FUNCTION public.recalc_player_vet(p_room_id uuid, p_player_number integer)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_spent integer;
BEGIN
  v_spent := public.calc_player_vet_spent(p_room_id, p_player_number);

  IF p_player_number = 1 THEN
    UPDATE public.match_state
    SET
      player1_vet_spent = v_spent,
      player1_vet_remaining = GREATEST(player1_vet_budget - v_spent, 0),
      updated_at = now()
    WHERE room_id = p_room_id;
  ELSE
    UPDATE public.match_state
    SET
      player2_vet_spent = v_spent,
      player2_vet_remaining = GREATEST(player2_vet_budget - v_spent, 0),
      updated_at = now()
    WHERE room_id = p_room_id;
  END IF;
END;
$$;

-- 3) Finalize scenario: set budgets (vet_agreed - logistics cost) and clear transient logistics state
CREATE OR REPLACE FUNCTION public.finalize_scenario(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_state RECORD;
  v_p1_total_spent INTEGER := 0;
  v_p2_total_spent INTEGER := 0;
  v_p1_vet_logistics INTEGER;
  v_p2_vet_logistics INTEGER;
  v_budget_p1 INTEGER;
  v_budget_p2 INTEGER;
  v_new_version INTEGER;
BEGIN
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  IF NOT v_state.logistics_resolved THEN
    RAISE EXCEPTION 'Logística ainda não foi resolvida';
  END IF;

  -- Total spent in logistics bids (both rounds)
  IF v_state.player1_round1_bid IS NOT NULL THEN
    SELECT v_p1_total_spent + COALESCE(SUM((value)::integer), 0) INTO v_p1_total_spent
    FROM jsonb_each_text(v_state.player1_round1_bid->'terrains');
    SELECT v_p1_total_spent + COALESCE(SUM((value)::integer), 0) INTO v_p1_total_spent
    FROM jsonb_each_text(v_state.player1_round1_bid->'seasons');
  END IF;
  IF v_state.player1_round2_bid IS NOT NULL THEN
    SELECT v_p1_total_spent + COALESCE(SUM((value)::integer), 0) INTO v_p1_total_spent
    FROM jsonb_each_text(v_state.player1_round2_bid->'terrains');
    SELECT v_p1_total_spent + COALESCE(SUM((value)::integer), 0) INTO v_p1_total_spent
    FROM jsonb_each_text(v_state.player1_round2_bid->'seasons');
  END IF;

  IF v_state.player2_round1_bid IS NOT NULL THEN
    SELECT v_p2_total_spent + COALESCE(SUM((value)::integer), 0) INTO v_p2_total_spent
    FROM jsonb_each_text(v_state.player2_round1_bid->'terrains');
    SELECT v_p2_total_spent + COALESCE(SUM((value)::integer), 0) INTO v_p2_total_spent
    FROM jsonb_each_text(v_state.player2_round1_bid->'seasons');
  END IF;
  IF v_state.player2_round2_bid IS NOT NULL THEN
    SELECT v_p2_total_spent + COALESCE(SUM((value)::integer), 0) INTO v_p2_total_spent
    FROM jsonb_each_text(v_state.player2_round2_bid->'terrains');
    SELECT v_p2_total_spent + COALESCE(SUM((value)::integer), 0) INTO v_p2_total_spent
    FROM jsonb_each_text(v_state.player2_round2_bid->'seasons');
  END IF;

  -- Logistics VET cost = ceil(logistics/2)
  v_p1_vet_logistics := CEIL(v_p1_total_spent::numeric / 2);
  v_p2_vet_logistics := CEIL(v_p2_total_spent::numeric / 2);

  v_budget_p1 := GREATEST(v_state.vet_agreed - v_p1_vet_logistics, 0);
  v_budget_p2 := GREATEST(v_state.vet_agreed - v_p2_vet_logistics, 0);

  -- Persist budgets, clear transient phase2 state, reset spent/remaining for deckbuilding
  UPDATE public.match_state
  SET
    vet_cost_logistics_p1 = v_p1_vet_logistics,
    vet_cost_logistics_p2 = v_p2_vet_logistics,
    player1_vet_budget = v_budget_p1,
    player2_vet_budget = v_budget_p2,
    player1_vet_spent = 0,
    player2_vet_spent = 0,
    player1_vet_remaining = v_budget_p1,
    player2_vet_remaining = v_budget_p2,

    -- Clear transient logistics state (keep only scenario options + final chosen)
    terrain_tiebreak_eligible = NULL,
    season_tiebreak_eligible = NULL,
    player1_round1_bid = NULL,
    player2_round1_bid = NULL,
    player1_round2_bid = NULL,
    player2_round2_bid = NULL,
    logistics_round = 0,

    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;

  UPDATE public.rooms
  SET current_phase = 'deckbuilding', updated_at = now()
  WHERE id = p_room_id;

  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (
    p_room_id,
    0,
    'finalize_scenario',
    jsonb_build_object(
      'player1_logistics_spent', v_p1_total_spent,
      'player2_logistics_spent', v_p2_total_spent,
      'player1_vet_logistics', v_p1_vet_logistics,
      'player2_vet_logistics', v_p2_vet_logistics,
      'player1_vet_budget', v_budget_p1,
      'player2_vet_budget', v_budget_p2,
      'chosen_terrain_id', v_state.chosen_terrain_id,
      'chosen_season_id', v_state.chosen_season_id
    ),
    'scenario_selection',
    v_new_version
  );

  RETURN jsonb_build_object(
    'success', true,
    'version', v_new_version,
    'player1_vet_budget', v_budget_p1,
    'player2_vet_budget', v_budget_p2,
    'player1_vet_spent', 0,
    'player2_vet_spent', 0,
    'player1_vet_remaining', v_budget_p1,
    'player2_vet_remaining', v_budget_p2
  );
END;
$$;