
-- ================================================================
-- HARDENING PASS FASE 3 - DECKBUILDING
-- 1) VET Budget model corrigido
-- 2) Deck normalizado (só IDs)
-- 3) Cartas básicas
-- 4) Autorização via session_id
-- ================================================================

-- Adicionar coluna para cartas básicas (flag, não precisa armazenar IDs)
ALTER TABLE public.match_state 
ADD COLUMN IF NOT EXISTS player1_basic_cards_granted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS player2_basic_cards_granted BOOLEAN NOT NULL DEFAULT false;

-- NOTA: player1_vet_remaining e player2_vet_remaining já existem e servem como BUDGET
-- Vamos manter eles como budget e calcular spent dinamicamente

-- ================================================================
-- FUNÇÃO AUXILIAR: Obter player_number pelo session_id
-- ================================================================
CREATE OR REPLACE FUNCTION public.get_player_number_by_session(p_room_id uuid, p_session_id text)
RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_player_number INTEGER;
BEGIN
  SELECT player_number INTO v_player_number
  FROM public.room_players
  WHERE room_id = p_room_id AND session_id = p_session_id;
  
  IF v_player_number IS NULL THEN
    RAISE EXCEPTION 'Jogador não encontrado nesta sala ou session_id inválido';
  END IF;
  
  RETURN v_player_number;
END;
$$;

-- ================================================================
-- FUNÇÃO AUXILIAR: Calcular VET gasto por jogador
-- ================================================================
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
  v_card_id UUID;
  v_card_vet INTEGER;
BEGIN
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Atributos
  IF p_player_number = 1 THEN
    v_attributes := COALESCE(v_state.player1_army_attributes, '{"attack":0,"defense":0,"mobility":0}'::jsonb);
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_deck := v_state.player1_deck;
  ELSE
    v_attributes := COALESCE(v_state.player2_army_attributes, '{"attack":0,"defense":0,"mobility":0}'::jsonb);
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_deck := v_state.player2_deck;
  END IF;
  
  -- Custo de atributos: cada +1 = 5 VET
  v_attr_cost := (
    COALESCE((v_attributes->>'attack')::integer, 0) +
    COALESCE((v_attributes->>'defense')::integer, 0) +
    COALESCE((v_attributes->>'mobility')::integer, 0)
  ) * 5;
  
  -- Custo de comandantes
  SELECT COALESCE(SUM((c->>'custo_vet')::integer), 0) INTO v_cmd_cost
  FROM jsonb_array_elements(v_commanders) c;
  
  -- Custo de cartas (buscar na tabela)
  IF v_deck IS NOT NULL THEN
    -- Offensive
    FOR v_card_id IN SELECT (jsonb_array_elements_text(COALESCE(v_deck->'offensive', '[]'::jsonb)))::uuid
    LOOP
      SELECT COALESCE(vet_cost_override, vet_cost, 1) INTO v_card_vet 
      FROM public.mass_combat_tactical_cards WHERE id = v_card_id;
      v_card_cost := v_card_cost + COALESCE(v_card_vet, 0);
    END LOOP;
    -- Defensive
    FOR v_card_id IN SELECT (jsonb_array_elements_text(COALESCE(v_deck->'defensive', '[]'::jsonb)))::uuid
    LOOP
      SELECT COALESCE(vet_cost_override, vet_cost, 1) INTO v_card_vet 
      FROM public.mass_combat_tactical_cards WHERE id = v_card_id;
      v_card_cost := v_card_cost + COALESCE(v_card_vet, 0);
    END LOOP;
    -- Initiative
    FOR v_card_id IN SELECT (jsonb_array_elements_text(COALESCE(v_deck->'initiative', '[]'::jsonb)))::uuid
    LOOP
      SELECT COALESCE(vet_cost_override, vet_cost, 1) INTO v_card_vet 
      FROM public.mass_combat_tactical_cards WHERE id = v_card_id;
      v_card_cost := v_card_cost + COALESCE(v_card_vet, 0);
    END LOOP;
    -- Reactions
    FOR v_card_id IN SELECT (jsonb_array_elements_text(COALESCE(v_deck->'reactions', '[]'::jsonb)))::uuid
    LOOP
      SELECT COALESCE(vet_cost_override, vet_cost, 1) INTO v_card_vet 
      FROM public.mass_combat_tactical_cards WHERE id = v_card_id;
      v_card_cost := v_card_cost + COALESCE(v_card_vet, 0);
    END LOOP;
  END IF;
  
  RETURN v_attr_cost + v_cmd_cost + v_card_cost;
END;
$$;

-- ================================================================
-- RPC: set_army_attributes (com autorização por session_id)
-- ================================================================
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
  v_new_version INTEGER;
BEGIN
  -- Autorização
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  -- Buscar estado
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Validar valores
  IF p_attack < 0 OR p_defense < 0 OR p_mobility < 0 THEN
    RAISE EXCEPTION 'Atributos não podem ser negativos';
  END IF;
  
  -- Calcular custo dos novos atributos
  v_new_attr_cost := (p_attack + p_defense + p_mobility) * 5;
  
  -- Pegar budget e calcular spent atual (sem atributos)
  IF v_player_number = 1 THEN
    v_vet_budget := v_state.player1_vet_remaining;
    v_old_attr_cost := (
      COALESCE((v_state.player1_army_attributes->>'attack')::integer, 0) +
      COALESCE((v_state.player1_army_attributes->>'defense')::integer, 0) +
      COALESCE((v_state.player1_army_attributes->>'mobility')::integer, 0)
    ) * 5;
  ELSE
    v_vet_budget := v_state.player2_vet_remaining;
    v_old_attr_cost := (
      COALESCE((v_state.player2_army_attributes->>'attack')::integer, 0) +
      COALESCE((v_state.player2_army_attributes->>'defense')::integer, 0) +
      COALESCE((v_state.player2_army_attributes->>'mobility')::integer, 0)
    ) * 5;
  END IF;
  
  -- Calcular spent atual
  v_current_spent := public.calc_player_vet_spent(p_room_id, v_player_number);
  
  -- Validar orçamento (spent - old_attr + new_attr <= budget)
  IF (v_current_spent - v_old_attr_cost + v_new_attr_cost) > v_vet_budget THEN
    RAISE EXCEPTION 'VET insuficiente. Budget: %, Novo gasto: %', v_vet_budget, (v_current_spent - v_old_attr_cost + v_new_attr_cost);
  END IF;
  
  -- Salvar atributos
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_army_attributes = jsonb_build_object('attack', p_attack, 'defense', p_defense, 'mobility', p_mobility),
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_army_attributes = jsonb_build_object('attack', p_attack, 'defense', p_defense, 'mobility', p_mobility),
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'set_attributes', 
    jsonb_build_object('attack', p_attack, 'defense', p_defense, 'mobility', p_mobility, 'cost', v_new_attr_cost), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'vet_spent', public.calc_player_vet_spent(p_room_id, v_player_number),
    'vet_budget', v_vet_budget
  );
END;
$$;

-- ================================================================
-- RPC: add_commander (com autorização)
-- ================================================================
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
  v_vet_budget INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Autorização
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  -- Buscar estado
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Buscar template do comandante
  SELECT * INTO v_commander FROM public.mass_combat_commander_templates WHERE id = p_commander_id;
  
  IF v_commander IS NULL THEN
    RAISE EXCEPTION 'Comandante não encontrado';
  END IF;
  
  -- Pegar comandantes atuais e budget
  IF v_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_vet_budget := v_state.player1_vet_remaining;
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_vet_budget := v_state.player2_vet_remaining;
  END IF;
  
  -- Verificar limite de 6 comandantes
  v_commander_count := jsonb_array_length(v_commanders);
  IF v_commander_count >= 6 THEN
    RAISE EXCEPTION 'Máximo de 6 comandantes atingido';
  END IF;
  
  -- Verificar se já tem este comandante
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_commanders) c WHERE (c->>'id')::uuid = p_commander_id) THEN
    RAISE EXCEPTION 'Comandante já adicionado';
  END IF;
  
  -- Calcular spent atual + novo comandante
  v_current_spent := public.calc_player_vet_spent(p_room_id, v_player_number) + v_commander.custo_vet;
  
  IF v_current_spent > v_vet_budget THEN
    RAISE EXCEPTION 'VET insuficiente. Budget: %, Gasto: %', v_vet_budget, v_current_spent;
  END IF;
  
  -- Adicionar comandante
  v_commanders := v_commanders || jsonb_build_array(jsonb_build_object(
    'id', p_commander_id,
    'numero', v_commander.numero,
    'especializacao', v_commander.especializacao,
    'comando', v_commander.comando,
    'estrategia', v_commander.estrategia,
    'guarda', v_commander.guarda,
    'custo_vet', v_commander.custo_vet
  ));
  
  -- Salvar
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET player1_commanders = v_commanders, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET player2_commanders = v_commanders, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'add_commander', 
    jsonb_build_object('commander_id', p_commander_id, 'custo_vet', v_commander.custo_vet), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'commander_count', v_commander_count + 1,
    'vet_spent', v_current_spent,
    'vet_budget', v_vet_budget
  );
END;
$$;

-- ================================================================
-- RPC: remove_commander (com autorização)
-- ================================================================
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
  v_new_version INTEGER;
BEGIN
  -- Autorização
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  IF v_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_general_id := v_state.player1_general_id;
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_general_id := v_state.player2_general_id;
  END IF;
  
  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_commanders)
  LOOP
    IF (v_elem->>'id')::uuid != p_commander_id THEN
      v_new_commanders := v_new_commanders || jsonb_build_array(v_elem);
    END IF;
  END LOOP;
  
  -- Se era o general, limpar
  IF v_general_id = p_commander_id THEN
    v_general_id := NULL;
  END IF;
  
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET player1_commanders = v_new_commanders, player1_general_id = v_general_id, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET player2_commanders = v_new_commanders, player2_general_id = v_general_id, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'remove_commander', 
    jsonb_build_object('commander_id', p_commander_id), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'vet_spent', public.calc_player_vet_spent(p_room_id, v_player_number)
  );
END;
$$;

-- ================================================================
-- RPC: set_general (com autorização)
-- ================================================================
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
  v_elem jsonb;
  v_new_version INTEGER;
BEGIN
  -- Autorização
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  IF v_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
  END IF;
  
  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_commanders)
  LOOP
    IF (v_elem->>'id')::uuid = p_commander_id THEN
      v_found := true;
      EXIT;
    END IF;
  END LOOP;
  
  IF NOT v_found THEN
    RAISE EXCEPTION 'Comandante não está no seu exército';
  END IF;
  
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET player1_general_id = p_commander_id, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET player2_general_id = p_commander_id, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'set_general', 
    jsonb_build_object('commander_id', p_commander_id), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version);
END;
$$;

-- ================================================================
-- RPC: add_card_to_deck (NORMALIZADO - só IDs, com autorização)
-- ================================================================
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
  v_vet_budget INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Autorização
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Buscar carta
  SELECT * INTO v_card FROM public.mass_combat_tactical_cards WHERE id = p_card_id;
  
  IF v_card IS NULL THEN
    RAISE EXCEPTION 'Carta não encontrada';
  END IF;
  
  -- Validar categoria
  IF p_category NOT IN ('offensive', 'defensive', 'initiative', 'reactions') THEN
    RAISE EXCEPTION 'Categoria inválida: %', p_category;
  END IF;
  
  -- Pegar deck e atributos atuais
  IF v_player_number = 1 THEN
    v_deck := COALESCE(v_state.player1_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
    v_vet_budget := v_state.player1_vet_remaining;
    v_attack := COALESCE((v_state.player1_army_attributes->>'attack')::integer, 0);
    v_defense := COALESCE((v_state.player1_army_attributes->>'defense')::integer, 0);
    v_mobility := COALESCE((v_state.player1_army_attributes->>'mobility')::integer, 0);
  ELSE
    v_deck := COALESCE(v_state.player2_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
    v_vet_budget := v_state.player2_vet_remaining;
    v_attack := COALESCE((v_state.player2_army_attributes->>'attack')::integer, 0);
    v_defense := COALESCE((v_state.player2_army_attributes->>'defense')::integer, 0);
    v_mobility := COALESCE((v_state.player2_army_attributes->>'mobility')::integer, 0);
  END IF;
  
  -- Definir limite baseado na categoria
  CASE p_category
    WHEN 'offensive' THEN v_limit := v_attack;
    WHEN 'defensive' THEN v_limit := v_defense;
    WHEN 'initiative' THEN v_limit := v_mobility;
    WHEN 'reactions' THEN v_limit := v_mobility * 2;
  END CASE;
  
  v_category_cards := COALESCE(v_deck->p_category, '[]'::jsonb);
  v_category_count := jsonb_array_length(v_category_cards);
  
  IF v_category_count >= v_limit THEN
    RAISE EXCEPTION 'Limite de % cartas % atingido', v_limit, p_category;
  END IF;
  
  -- Verificar cópia única (em todas as categorias) - agora são só IDs
  IF v_deck->'offensive' ? p_card_id::text OR
     v_deck->'defensive' ? p_card_id::text OR
     v_deck->'initiative' ? p_card_id::text OR
     v_deck->'reactions' ? p_card_id::text THEN
    -- Checar como array de strings
    IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(v_deck->'offensive', '[]'::jsonb)) t WHERE t = p_card_id::text) OR
       EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(v_deck->'defensive', '[]'::jsonb)) t WHERE t = p_card_id::text) OR
       EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(v_deck->'initiative', '[]'::jsonb)) t WHERE t = p_card_id::text) OR
       EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(v_deck->'reactions', '[]'::jsonb)) t WHERE t = p_card_id::text) THEN
      RAISE EXCEPTION 'Carta já está no deck (máximo 1 cópia)';
    END IF;
  END IF;
  
  -- Calcular novo spent
  v_current_spent := public.calc_player_vet_spent(p_room_id, v_player_number) + COALESCE(v_card.vet_cost_override, v_card.vet_cost, 1);
  
  IF v_current_spent > v_vet_budget THEN
    RAISE EXCEPTION 'VET insuficiente. Budget: %, Gasto: %', v_vet_budget, v_current_spent;
  END IF;
  
  -- Adicionar carta (SÓ ID!)
  v_category_cards := v_category_cards || to_jsonb(p_card_id::text);
  v_deck := jsonb_set(v_deck, ARRAY[p_category], v_category_cards);
  
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET player1_deck = v_deck, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET player2_deck = v_deck, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'add_card', 
    jsonb_build_object('card_id', p_card_id, 'category', p_category, 'vet_cost', COALESCE(v_card.vet_cost_override, v_card.vet_cost)), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'category_count', v_category_count + 1,
    'category_limit', v_limit,
    'vet_spent', v_current_spent,
    'vet_budget', v_vet_budget
  );
END;
$$;

-- ================================================================
-- RPC: remove_card_from_deck (normalizado, com autorização)
-- ================================================================
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
  v_card_id_text TEXT;
  v_new_version INTEGER;
BEGIN
  -- Autorização
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  IF v_player_number = 1 THEN
    v_deck := COALESCE(v_state.player1_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
  ELSE
    v_deck := COALESCE(v_state.player2_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
  END IF;
  
  v_category_cards := COALESCE(v_deck->p_category, '[]'::jsonb);
  
  -- Remover carta (agora é só ID)
  FOR v_card_id_text IN SELECT jsonb_array_elements_text(v_category_cards)
  LOOP
    IF v_card_id_text != p_card_id::text THEN
      v_new_cards := v_new_cards || to_jsonb(v_card_id_text);
    END IF;
  END LOOP;
  
  v_deck := jsonb_set(v_deck, ARRAY[p_category], v_new_cards);
  
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET player1_deck = v_deck, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET player2_deck = v_deck, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'remove_card', 
    jsonb_build_object('card_id', p_card_id, 'category', p_category), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'vet_spent', public.calc_player_vet_spent(p_room_id, v_player_number)
  );
END;
$$;

-- ================================================================
-- RPC: confirm_deckbuilding (com autorização)
-- ================================================================
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
BEGIN
  -- Autorização
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  IF v_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_general_id := v_state.player1_general_id;
    v_attributes := v_state.player1_army_attributes;
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_general_id := v_state.player2_general_id;
    v_attributes := v_state.player2_army_attributes;
  END IF;
  
  IF jsonb_array_length(v_commanders) < 1 THEN
    RAISE EXCEPTION 'Precisa ter pelo menos 1 comandante';
  END IF;
  
  IF v_general_id IS NULL THEN
    RAISE EXCEPTION 'Precisa definir um General';
  END IF;
  
  -- Marcar basic cards como concedidas
  IF v_player_number = 1 THEN
    UPDATE public.match_state
    SET player1_deck_confirmed = true, player1_basic_cards_granted = true, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET player2_deck_confirmed = true, player2_basic_cards_granted = true, version = version + 1, updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'confirm_deckbuilding', 
    jsonb_build_object('commanders_count', jsonb_array_length(v_commanders), 'general_id', v_general_id), 
    'deckbuilding', v_new_version);
  
  SELECT (player1_deck_confirmed AND player2_deck_confirmed) INTO v_both_confirmed
  FROM public.match_state WHERE room_id = p_room_id;
  
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
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'both_confirmed', v_both_confirmed);
END;
$$;

-- ================================================================
-- RPC: get_vet_status (helper para UI)
-- ================================================================
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
    v_vet_budget := v_state.player1_vet_remaining;
  ELSE
    v_vet_budget := v_state.player2_vet_remaining;
  END IF;
  
  v_vet_spent := public.calc_player_vet_spent(p_room_id, v_player_number);
  
  RETURN jsonb_build_object(
    'budget', v_vet_budget,
    'spent', v_vet_spent,
    'remaining', v_vet_budget - v_vet_spent
  );
END;
$$;
