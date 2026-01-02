-- 1. Fix start_scenario_selection to initialize vet_budget and vet_remaining = vet_agreed
CREATE OR REPLACE FUNCTION public.start_scenario_selection(p_room_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_terrains JSONB;
  v_seasons JSONB;
  v_options JSONB;
  v_new_version INTEGER;
BEGIN
  -- Buscar estado atual
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Se já tem opções, retornar as existentes
  IF v_state.scenario_options IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'scenario_options', v_state.scenario_options, 'already_exists', true);
  END IF;
  
  -- Gerar seed se não existir
  IF v_state.game_seed IS NULL THEN
    UPDATE public.match_state
    SET game_seed = gen_random_uuid()::text
    WHERE room_id = p_room_id;
  END IF;
  
  -- Sortear 3 terrenos distintos (ordem é importante para desempate)
  SELECT jsonb_agg(jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'order', t.rn
  ))
  INTO v_terrains
  FROM (
    SELECT id, name, ROW_NUMBER() OVER (ORDER BY random()) as rn
    FROM public.mass_combat_primary_terrains
    ORDER BY random()
    LIMIT 3
  ) t;
  
  -- Sortear 3 estações distintas (das 4)
  SELECT jsonb_agg(jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'order', s.rn
  ))
  INTO v_seasons
  FROM (
    SELECT id, name, ROW_NUMBER() OVER (ORDER BY random()) as rn
    FROM public.mass_combat_seasons
    ORDER BY random()
    LIMIT 3
  ) s;
  
  -- Montar opções completas
  v_options := jsonb_build_object(
    'terrains', v_terrains,
    'seasons', v_seasons
  );
  
  -- Salvar no match_state E inicializar vet_budget/vet_remaining = vet_agreed
  UPDATE public.match_state
  SET 
    scenario_options = v_options,
    logistics_round = 1,
    -- Inicializar VET budget e remaining para ambos jogadores = vet_agreed
    player1_vet_budget = vet_agreed,
    player2_vet_budget = vet_agreed,
    player1_vet_remaining = vet_agreed,
    player2_vet_remaining = vet_agreed,
    player1_vet_spent = 0,
    player2_vet_spent = 0,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'start_scenario_selection', v_options, 'scenario_selection', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'scenario_options', v_options, 
    'version', v_new_version,
    'vet_budget', v_state.vet_agreed,
    'vet_remaining', v_state.vet_agreed
  );
END;
$function$;

-- 2. Fix resolve_logistics_round to properly persist all VET values
CREATE OR REPLACE FUNCTION public.resolve_logistics_round(p_room_id uuid, p_round_number integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
    -- Para round 2, usamos os bids do round 2 para calcular totais
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
    player1_vet_spent = v_p1_vet_logistics,  -- vet_spent inicia com custo logística
    player2_vet_spent = v_p2_vet_logistics,  -- vet_spent inicia com custo logística
    player1_vet_remaining = v_budget_p1,
    player2_vet_remaining = v_budget_p2,
    
    -- Limpar estado transitório de logística (mas MANTER bids para debug/export)
    terrain_tiebreak_eligible = NULL,
    season_tiebreak_eligible = NULL,
    logistics_round = p_round_number,  -- Manter o round final para referência
    
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

-- 3. Create/update get_match_state RPC to return full state (for export)
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
BEGIN
  -- Get room
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Sala não encontrada';
  END IF;
  
  -- Get match state
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Get players
  SELECT jsonb_agg(jsonb_build_object(
    'player_number', rp.player_number,
    'nickname', rp.nickname,
    'status', rp.status,
    'is_host', rp.is_host
  )) INTO v_players
  FROM public.room_players rp WHERE rp.room_id = p_room_id;
  
  -- Return full state with actual database values (no fake defaults)
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
      
      -- VET configuration
      'vet_agreed', v_state.vet_agreed,
      'logistics_budget', v_state.logistics_budget,
      
      -- Cultures
      'player1_culture', v_state.player1_culture,
      'player1_culture_confirmed', v_state.player1_culture_confirmed,
      'player2_culture', v_state.player2_culture,
      'player2_culture_confirmed', v_state.player2_culture_confirmed,
      
      -- Scenario selection
      'scenario_options', v_state.scenario_options,
      'logistics_round', v_state.logistics_round,
      'logistics_resolved', v_state.logistics_resolved,
      
      -- Bids (keep for debugging)
      'player1_round1_bid', v_state.player1_round1_bid,
      'player2_round1_bid', v_state.player2_round1_bid,
      'player1_round2_bid', v_state.player1_round2_bid,
      'player2_round2_bid', v_state.player2_round2_bid,
      
      -- Tiebreak info
      'terrain_tiebreak_eligible', v_state.terrain_tiebreak_eligible,
      'season_tiebreak_eligible', v_state.season_tiebreak_eligible,
      
      -- Chosen scenario
      'chosen_terrain_id', v_state.chosen_terrain_id,
      'chosen_season_id', v_state.chosen_season_id,
      
      -- VET logistics cost
      'vet_cost_logistics_p1', v_state.vet_cost_logistics_p1,
      'vet_cost_logistics_p2', v_state.vet_cost_logistics_p2,
      
      -- VET budget and spending
      'player1_vet_budget', v_state.player1_vet_budget,
      'player2_vet_budget', v_state.player2_vet_budget,
      'player1_vet_spent', v_state.player1_vet_spent,
      'player2_vet_spent', v_state.player2_vet_spent,
      'player1_vet_remaining', v_state.player1_vet_remaining,
      'player2_vet_remaining', v_state.player2_vet_remaining,
      
      -- Army attributes
      'player1_army_attributes', v_state.player1_army_attributes,
      'player2_army_attributes', v_state.player2_army_attributes,
      
      -- Commanders
      'player1_commanders', v_state.player1_commanders,
      'player2_commanders', v_state.player2_commanders,
      'player1_general_id', v_state.player1_general_id,
      'player2_general_id', v_state.player2_general_id,
      
      -- Decks
      'player1_deck', v_state.player1_deck,
      'player2_deck', v_state.player2_deck,
      'player1_deck_confirmed', v_state.player1_deck_confirmed,
      'player2_deck_confirmed', v_state.player2_deck_confirmed,
      
      -- Timestamps
      'created_at', v_state.created_at,
      'updated_at', v_state.updated_at
    )
  );
END;
$function$;