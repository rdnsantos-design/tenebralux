-- =============================================
-- FASE 1 & 2: RPCs para Cultura e Logística
-- =============================================

-- Adicionar colunas necessárias ao match_state
ALTER TABLE public.match_state 
ADD COLUMN IF NOT EXISTS logistics_budget INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS vet_agreed INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS logistics_round INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS logistics_resolved BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS player1_round1_bid JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS player2_round1_bid JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS player1_round2_bid JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS player2_round2_bid JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS terrain_tiebreak_eligible JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS season_tiebreak_eligible JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS chosen_terrain_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS chosen_season_id UUID DEFAULT NULL;

-- Função para confirmar seleção de cultura
CREATE OR REPLACE FUNCTION public.confirm_culture(
  p_room_id UUID,
  p_player_number INTEGER,
  p_culture_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_state_version INTEGER;
  v_both_confirmed BOOLEAN;
BEGIN
  -- Atualizar cultura do jogador com version++
  IF p_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_culture = p_culture_id,
      player1_culture_confirmed = true,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_state_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_culture = p_culture_id,
      player2_culture_confirmed = true,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_state_version;
  END IF;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, p_player_number, 'confirm_culture', jsonb_build_object('culture_id', p_culture_id), 'culture_selection', v_state_version);
  
  -- Verificar se ambos confirmaram
  SELECT (player1_culture_confirmed AND player2_culture_confirmed) INTO v_both_confirmed
  FROM public.match_state
  WHERE room_id = p_room_id;
  
  -- Se ambos confirmaram, avançar fase
  IF v_both_confirmed THEN
    UPDATE public.rooms
    SET current_phase = 'scenario_selection', updated_at = now()
    WHERE id = p_room_id;
    
    UPDATE public.match_state
    SET version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_state_version;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 0, 'phase_advance', jsonb_build_object('new_phase', 'scenario_selection'), 'culture_selection', v_state_version);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'version', v_state_version, 'both_confirmed', v_both_confirmed);
END;
$$;

-- Função para iniciar seleção de cenário (sorteia terrenos e estações)
CREATE OR REPLACE FUNCTION public.start_scenario_selection(p_room_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
  
  -- Salvar no match_state
  UPDATE public.match_state
  SET 
    scenario_options = v_options,
    logistics_round = 1,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'start_scenario_selection', v_options, 'scenario_selection', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'scenario_options', v_options, 'version', v_new_version);
END;
$$;

-- Função para submeter aposta de logística
CREATE OR REPLACE FUNCTION public.submit_logistics_bid(
  p_room_id UUID,
  p_player_number INTEGER,
  p_round_number INTEGER,
  p_bid JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_state RECORD;
  v_total_spent INTEGER;
  v_previous_spent INTEGER := 0;
  v_new_version INTEGER;
  v_terrain_bids JSONB;
  v_season_bids JSONB;
BEGIN
  -- Buscar estado atual
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Extrair apostas
  v_terrain_bids := p_bid->'terrains';
  v_season_bids := p_bid->'seasons';
  
  -- Calcular total gasto nesta rodada
  SELECT COALESCE(SUM((value)::integer), 0) INTO v_total_spent
  FROM jsonb_each_text(v_terrain_bids);
  
  SELECT v_total_spent + COALESCE(SUM((value)::integer), 0) INTO v_total_spent
  FROM jsonb_each_text(v_season_bids);
  
  -- Se rodada 2, calcular gasto anterior
  IF p_round_number = 2 THEN
    IF p_player_number = 1 AND v_state.player1_round1_bid IS NOT NULL THEN
      SELECT COALESCE(SUM((value)::integer), 0) INTO v_previous_spent
      FROM jsonb_each_text(v_state.player1_round1_bid->'terrains');
      SELECT v_previous_spent + COALESCE(SUM((value)::integer), 0) INTO v_previous_spent
      FROM jsonb_each_text(v_state.player1_round1_bid->'seasons');
    ELSIF p_player_number = 2 AND v_state.player2_round1_bid IS NOT NULL THEN
      SELECT COALESCE(SUM((value)::integer), 0) INTO v_previous_spent
      FROM jsonb_each_text(v_state.player2_round1_bid->'terrains');
      SELECT v_previous_spent + COALESCE(SUM((value)::integer), 0) INTO v_previous_spent
      FROM jsonb_each_text(v_state.player2_round1_bid->'seasons');
    END IF;
  END IF;
  
  -- Validar saldo
  IF (v_total_spent + v_previous_spent) > v_state.logistics_budget THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponível: %, Tentando gastar: %', 
      (v_state.logistics_budget - v_previous_spent), v_total_spent;
  END IF;
  
  -- Salvar aposta
  IF p_round_number = 1 THEN
    IF p_player_number = 1 THEN
      UPDATE public.match_state
      SET player1_round1_bid = p_bid, version = version + 1, updated_at = now()
      WHERE room_id = p_room_id
      RETURNING version INTO v_new_version;
    ELSE
      UPDATE public.match_state
      SET player2_round1_bid = p_bid, version = version + 1, updated_at = now()
      WHERE room_id = p_room_id
      RETURNING version INTO v_new_version;
    END IF;
  ELSE
    IF p_player_number = 1 THEN
      UPDATE public.match_state
      SET player1_round2_bid = p_bid, version = version + 1, updated_at = now()
      WHERE room_id = p_room_id
      RETURNING version INTO v_new_version;
    ELSE
      UPDATE public.match_state
      SET player2_round2_bid = p_bid, version = version + 1, updated_at = now()
      WHERE room_id = p_room_id
      RETURNING version INTO v_new_version;
    END IF;
  END IF;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, p_player_number, 'submit_bid', 
    jsonb_build_object('round', p_round_number, 'bid', p_bid), 
    'scenario_selection', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'total_spent', v_total_spent + v_previous_spent);
END;
$$;

-- Função auxiliar para calcular soma de apostas por opção
CREATE OR REPLACE FUNCTION public.calc_option_totals(
  p_bid1 JSONB,
  p_bid2 JSONB,
  p_options JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB := '[]'::jsonb;
  v_option RECORD;
  v_id TEXT;
  v_total INTEGER;
BEGIN
  FOR v_option IN SELECT * FROM jsonb_array_elements(p_options) AS opt
  LOOP
    v_id := v_option.opt->>'id';
    v_total := COALESCE((p_bid1->>v_id)::integer, 0) + COALESCE((p_bid2->>v_id)::integer, 0);
    v_result := v_result || jsonb_build_object(
      'id', v_id,
      'name', v_option.opt->>'name',
      'order', (v_option.opt->>'order')::integer,
      'total', v_total
    );
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- Função para resolver rodada de logística
CREATE OR REPLACE FUNCTION public.resolve_logistics_round(p_room_id UUID, p_round_number INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
    -- Somar apostas das duas rodadas
    v_p1_bid := jsonb_build_object(
      'terrains', (
        SELECT jsonb_object_agg(key, COALESCE((v_state.player1_round1_bid->'terrains'->>key)::int, 0) + COALESCE((v_state.player1_round2_bid->'terrains'->>key)::int, 0))
        FROM jsonb_object_keys(v_state.scenario_options->'terrains'->0) AS key
      ),
      'seasons', (
        SELECT jsonb_object_agg(key, COALESCE((v_state.player1_round1_bid->'seasons'->>key)::int, 0) + COALESCE((v_state.player1_round2_bid->'seasons'->>key)::int, 0))
        FROM jsonb_object_keys(v_state.scenario_options->'seasons'->0) AS key
      )
    );
    v_p2_bid := jsonb_build_object(
      'terrains', (
        SELECT jsonb_object_agg(key, COALESCE((v_state.player2_round1_bid->'terrains'->>key)::int, 0) + COALESCE((v_state.player2_round2_bid->'terrains'->>key)::int, 0))
        FROM jsonb_object_keys(v_state.scenario_options->'terrains'->0) AS key
      ),
      'seasons', (
        SELECT jsonb_object_agg(key, COALESCE((v_state.player2_round1_bid->'seasons'->>key)::int, 0) + COALESCE((v_state.player2_round2_bid->'seasons'->>key)::int, 0))
        FROM jsonb_object_keys(v_state.scenario_options->'seasons'->0) AS key
      )
    );
  END IF;
  
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
    
    -- Registrar ação
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
  
  -- Atualizar estado com vencedores
  UPDATE public.match_state
  SET 
    chosen_terrain_id = (v_winner_terrain->>'id')::uuid,
    chosen_season_id = (v_winner_season->>'id')::uuid,
    logistics_resolved = true,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'resolve_round', 
    jsonb_build_object(
      'round', p_round_number, 
      'needs_round2', false,
      'terrain_totals', v_terrain_totals,
      'season_totals', v_season_totals,
      'winner_terrain', v_winner_terrain,
      'winner_season', v_winner_season
    ), 
    'scenario_selection', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true,
    'resolved', true,
    'winner_terrain', v_winner_terrain,
    'winner_season', v_winner_season,
    'terrain_totals', v_terrain_totals,
    'season_totals', v_season_totals,
    'version', v_new_version
  );
END;
$$;

-- Função para finalizar cenário e calcular VET
CREATE OR REPLACE FUNCTION public.finalize_scenario(p_room_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_state RECORD;
  v_p1_total_spent INTEGER := 0;
  v_p2_total_spent INTEGER := 0;
  v_p1_vet_spent INTEGER;
  v_p2_vet_spent INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Buscar estado atual
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  IF NOT v_state.logistics_resolved THEN
    RAISE EXCEPTION 'Logística ainda não foi resolvida';
  END IF;
  
  -- Calcular total gasto por jogador 1
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
  
  -- Calcular total gasto por jogador 2
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
  
  -- Calcular VET gasto (ceil(logística/2))
  v_p1_vet_spent := CEIL(v_p1_total_spent::numeric / 2);
  v_p2_vet_spent := CEIL(v_p2_total_spent::numeric / 2);
  
  -- Atualizar VET restante e avançar fase
  UPDATE public.match_state
  SET 
    player1_vet_remaining = v_state.vet_agreed - v_p1_vet_spent,
    player2_vet_remaining = v_state.vet_agreed - v_p2_vet_spent,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  UPDATE public.rooms
  SET current_phase = 'deckbuilding', updated_at = now()
  WHERE id = p_room_id;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'finalize_scenario', 
    jsonb_build_object(
      'player1_logistics_spent', v_p1_total_spent,
      'player2_logistics_spent', v_p2_total_spent,
      'player1_vet_spent', v_p1_vet_spent,
      'player2_vet_spent', v_p2_vet_spent,
      'player1_vet_remaining', v_state.vet_agreed - v_p1_vet_spent,
      'player2_vet_remaining', v_state.vet_agreed - v_p2_vet_spent,
      'chosen_terrain_id', v_state.chosen_terrain_id,
      'chosen_season_id', v_state.chosen_season_id
    ), 
    'scenario_selection', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true,
    'player1_vet_spent', v_p1_vet_spent,
    'player2_vet_spent', v_p2_vet_spent,
    'player1_vet_remaining', v_state.vet_agreed - v_p1_vet_spent,
    'player2_vet_remaining', v_state.vet_agreed - v_p2_vet_spent,
    'version', v_new_version
  );
END;
$$;