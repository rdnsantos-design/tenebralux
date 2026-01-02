-- Fix resolve_logistics_round to include search_path (security fix)
CREATE OR REPLACE FUNCTION public.resolve_logistics_round(p_room_id uuid, p_round_number integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_p1_bid JSONB;
  v_p2_bid JSONB;
  v_terrain_totals JSONB;
  v_season_totals JSONB;
  v_terrain_max INTEGER;
  v_season_max INTEGER;
  v_terrain_tied JSONB := '[]'::jsonb;
  v_season_tied JSONB := '[]'::jsonb;
  v_needs_round2 BOOLEAN := false;
  v_new_version INTEGER;
  v_winner_terrain JSONB;
  v_winner_season JSONB;
  
  -- Variáveis para cálculo de VET
  v_p1_total_spent INTEGER := 0;
  v_p2_total_spent INTEGER := 0;
  v_p1_vet_logistics INTEGER;
  v_p2_vet_logistics INTEGER;
  v_budget_p1 INTEGER;
  v_budget_p2 INTEGER;
BEGIN
  -- Buscar estado atual
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Verificar se ambos apostaram
  IF p_round_number = 1 THEN
    IF v_state.player1_round1_bid IS NULL OR v_state.player2_round1_bid IS NULL THEN
      RAISE EXCEPTION 'Ambos jogadores precisam apostar primeiro';
    END IF;
    v_p1_bid := v_state.player1_round1_bid;
    v_p2_bid := v_state.player2_round1_bid;
  ELSE
    IF v_state.player1_round2_bid IS NULL OR v_state.player2_round2_bid IS NULL THEN
      RAISE EXCEPTION 'Ambos jogadores precisam apostar primeiro';
    END IF;
    v_p1_bid := v_state.player1_round1_bid;
    v_p2_bid := v_state.player2_round1_bid;
  END IF;
  
  -- CALCULAR TOTAL GASTO EM LOGÍSTICA (soma de todas as rodadas)
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

  -- Calcular custo VET = ceil(logística/2)
  v_p1_vet_logistics := CEIL(v_p1_total_spent::numeric / 2);
  v_p2_vet_logistics := CEIL(v_p2_total_spent::numeric / 2);
  
  -- VET budget = vet_agreed - custo logística
  v_budget_p1 := GREATEST(v_state.vet_agreed - v_p1_vet_logistics, 0);
  v_budget_p2 := GREATEST(v_state.vet_agreed - v_p2_vet_logistics, 0);
  
  -- Calcular totais por terreno
  v_terrain_totals := public.calc_option_totals(
    v_p1_bid->'terrains', 
    v_p2_bid->'terrains', 
    v_state.scenario_options->'terrains'
  );
  
  -- Calcular totais por estação
  v_season_totals := public.calc_option_totals(
    v_p1_bid->'seasons', 
    v_p2_bid->'seasons', 
    v_state.scenario_options->'seasons'
  );
  
  -- Encontrar máximo de terreno
  SELECT MAX((t->>'total')::integer) INTO v_terrain_max
  FROM jsonb_array_elements(v_terrain_totals) t;
  
  -- Encontrar máximo de estação
  SELECT MAX((s->>'total')::integer) INTO v_season_max
  FROM jsonb_array_elements(v_season_totals) s;
  
  -- Identificar empates em terreno (opções com total == max)
  SELECT jsonb_agg(t) INTO v_terrain_tied
  FROM jsonb_array_elements(v_terrain_totals) t
  WHERE (t->>'total')::integer = v_terrain_max;
  
  -- Identificar empates em estação
  SELECT jsonb_agg(s) INTO v_season_tied
  FROM jsonb_array_elements(v_season_totals) s
  WHERE (s->>'total')::integer = v_season_max;
  
  -- Se rodada 1 e há empate no topo, preparar rodada 2
  IF p_round_number = 1 AND (jsonb_array_length(v_terrain_tied) > 1 OR jsonb_array_length(v_season_tied) > 1) THEN
    v_needs_round2 := true;
    
    UPDATE public.match_state
    SET 
      logistics_round = 2,
      terrain_tiebreak_eligible = CASE WHEN jsonb_array_length(v_terrain_tied) > 1 THEN v_terrain_tied ELSE NULL END,
      season_tiebreak_eligible = CASE WHEN jsonb_array_length(v_season_tied) > 1 THEN v_season_tied ELSE NULL END,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 0, 'resolve_round', 
      jsonb_build_object(
        'round', p_round_number, 
        'needs_round2', true,
        'terrain_totals', v_terrain_totals,
        'season_totals', v_season_totals,
        'terrain_tied', v_terrain_tied,
        'season_tied', v_season_tied
      ), 
      'scenario_selection', v_new_version);
    
    RETURN jsonb_build_object(
      'success', true, 
      'needs_round2', true,
      'terrain_totals', v_terrain_totals,
      'season_totals', v_season_totals,
      'terrain_tied', v_terrain_tied,
      'season_tied', v_season_tied,
      'version', v_new_version
    );
  END IF;
  
  -- Determinar vencedor por maior total (desempate por ordem se necessário)
  SELECT t INTO v_winner_terrain
  FROM jsonb_array_elements(v_terrain_tied) t
  ORDER BY (t->>'order')::integer
  LIMIT 1;
  
  SELECT s INTO v_winner_season
  FROM jsonb_array_elements(v_season_tied) s
  ORDER BY (s->>'order')::integer
  LIMIT 1;
  
  -- FINALIZAR: Atualizar estado com vencedores E orçamento VET persistido corretamente
  UPDATE public.match_state
  SET 
    chosen_terrain_id = (v_winner_terrain->>'id')::uuid,
    chosen_season_id = (v_winner_season->>'id')::uuid,
    logistics_resolved = true,
    
    -- Campos de VET calculados e persistidos
    vet_cost_logistics_p1 = v_p1_vet_logistics,
    vet_cost_logistics_p2 = v_p2_vet_logistics,
    player1_vet_budget = v_budget_p1,
    player2_vet_budget = v_budget_p2,
    player1_vet_spent = v_p1_vet_logistics,
    player2_vet_spent = v_p2_vet_logistics,
    player1_vet_remaining = v_budget_p1,
    player2_vet_remaining = v_budget_p2,
    
    -- Limpar estado transitório de logística (mas MANTER bids para debug/export)
    terrain_tiebreak_eligible = NULL,
    season_tiebreak_eligible = NULL,
    logistics_round = p_round_number,
    
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Avançar para deckbuilding
  UPDATE public.rooms
  SET current_phase = 'deckbuilding', updated_at = now()
  WHERE id = p_room_id;
  
  -- Registrar ação com todos os dados
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'finalize_scenario', 
    jsonb_build_object(
      'round', p_round_number, 
      'player1_logistics_spent', v_p1_total_spent,
      'player2_logistics_spent', v_p2_total_spent,
      'player1_vet_logistics', v_p1_vet_logistics,
      'player2_vet_logistics', v_p2_vet_logistics,
      'player1_vet_budget', v_budget_p1,
      'player2_vet_budget', v_budget_p2,
      'winner_terrain', v_winner_terrain,
      'winner_season', v_winner_season,
      'terrain_totals', v_terrain_totals,
      'season_totals', v_season_totals
    ), 
    'scenario_selection', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true,
    'resolved', true,
    'winner_terrain', v_winner_terrain,
    'winner_season', v_winner_season,
    'terrain_totals', v_terrain_totals,
    'season_totals', v_season_totals,
    'player1_vet_budget', v_budget_p1,
    'player2_vet_budget', v_budget_p2,
    'player1_vet_logistics', v_p1_vet_logistics,
    'player2_vet_logistics', v_p2_vet_logistics,
    'player1_vet_remaining', v_budget_p1,
    'player2_vet_remaining', v_budget_p2,
    'version', v_new_version
  );
END;
$function$;