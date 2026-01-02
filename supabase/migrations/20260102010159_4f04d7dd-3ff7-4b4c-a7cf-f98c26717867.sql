-- =============================================
-- FASE 3: DECKBUILDING - RPCs e Colunas
-- =============================================

-- Adicionar colunas de atributos do exército em match_state
ALTER TABLE public.match_state
ADD COLUMN IF NOT EXISTS player1_army_attributes jsonb DEFAULT '{"attack": 0, "defense": 0, "mobility": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS player2_army_attributes jsonb DEFAULT '{"attack": 0, "defense": 0, "mobility": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS player1_commanders jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS player2_commanders jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS player1_general_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS player2_general_id uuid DEFAULT NULL;

-- =============================================
-- RPC: set_army_attributes
-- Define atributos do exército (attack, defense, mobility)
-- =============================================
CREATE OR REPLACE FUNCTION public.set_army_attributes(
  p_room_id uuid,
  p_player_number integer,
  p_attack integer,
  p_defense integer,
  p_mobility integer
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_attributes_cost INTEGER;
  v_commanders_cost INTEGER := 0;
  v_cards_cost INTEGER := 0;
  v_total_cost INTEGER;
  v_vet_remaining INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Buscar estado atual
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Validar valores
  IF p_attack < 0 OR p_defense < 0 OR p_mobility < 0 THEN
    RAISE EXCEPTION 'Atributos não podem ser negativos';
  END IF;
  
  -- Calcular custo dos atributos (cada +1 = 5 VET)
  v_attributes_cost := (p_attack + p_defense + p_mobility) * 5;
  
  -- Pegar VET restante do jogador
  IF p_player_number = 1 THEN
    v_vet_remaining := v_state.player1_vet_remaining;
    -- Calcular custo dos comandantes já comprados
    SELECT COALESCE(SUM((c->>'custo_vet')::integer), 0) INTO v_commanders_cost
    FROM jsonb_array_elements(v_state.player1_commanders) c;
    -- Calcular custo das cartas já compradas
    IF v_state.player1_deck IS NOT NULL THEN
      SELECT COALESCE(SUM((card->>'vet_cost')::integer), 0) INTO v_cards_cost
      FROM jsonb_array_elements(
        COALESCE(v_state.player1_deck->'offensive', '[]'::jsonb) ||
        COALESCE(v_state.player1_deck->'defensive', '[]'::jsonb) ||
        COALESCE(v_state.player1_deck->'initiative', '[]'::jsonb) ||
        COALESCE(v_state.player1_deck->'reactions', '[]'::jsonb)
      ) card;
    END IF;
  ELSE
    v_vet_remaining := v_state.player2_vet_remaining;
    SELECT COALESCE(SUM((c->>'custo_vet')::integer), 0) INTO v_commanders_cost
    FROM jsonb_array_elements(v_state.player2_commanders) c;
    IF v_state.player2_deck IS NOT NULL THEN
      SELECT COALESCE(SUM((card->>'vet_cost')::integer), 0) INTO v_cards_cost
      FROM jsonb_array_elements(
        COALESCE(v_state.player2_deck->'offensive', '[]'::jsonb) ||
        COALESCE(v_state.player2_deck->'defensive', '[]'::jsonb) ||
        COALESCE(v_state.player2_deck->'initiative', '[]'::jsonb) ||
        COALESCE(v_state.player2_deck->'reactions', '[]'::jsonb)
      ) card;
    END IF;
  END IF;
  
  v_total_cost := v_attributes_cost + v_commanders_cost + v_cards_cost;
  
  IF v_total_cost > v_vet_remaining THEN
    RAISE EXCEPTION 'VET insuficiente. Custo total: %, VET disponível: %', v_total_cost, v_vet_remaining;
  END IF;
  
  -- Salvar atributos
  IF p_player_number = 1 THEN
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
  VALUES (p_room_id, p_player_number, 'set_attributes', 
    jsonb_build_object('attack', p_attack, 'defense', p_defense, 'mobility', p_mobility, 'cost', v_attributes_cost), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'attributes_cost', v_attributes_cost,
    'total_committed', v_total_cost
  );
END;
$function$;

-- =============================================
-- RPC: add_commander
-- Adiciona um comandante ao exército
-- =============================================
CREATE OR REPLACE FUNCTION public.add_commander(
  p_room_id uuid,
  p_player_number integer,
  p_commander_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_commander RECORD;
  v_commanders jsonb;
  v_commander_count INTEGER;
  v_total_cost INTEGER;
  v_vet_remaining INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Buscar estado atual
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Buscar template do comandante
  SELECT * INTO v_commander FROM public.mass_combat_commander_templates WHERE id = p_commander_id;
  
  IF v_commander IS NULL THEN
    RAISE EXCEPTION 'Comandante não encontrado';
  END IF;
  
  -- Pegar comandantes atuais
  IF p_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_vet_remaining := v_state.player1_vet_remaining;
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_vet_remaining := v_state.player2_vet_remaining;
  END IF;
  
  -- Verificar limite de 6 comandantes
  v_commander_count := jsonb_array_length(v_commanders);
  IF v_commander_count >= 6 THEN
    RAISE EXCEPTION 'Máximo de 6 comandantes atingido';
  END IF;
  
  -- Verificar se já tem este comandante
  IF v_commanders @> jsonb_build_array(jsonb_build_object('id', p_commander_id::text)) THEN
    RAISE EXCEPTION 'Comandante já adicionado';
  END IF;
  
  -- Calcular custo total atual + novo comandante
  SELECT COALESCE(SUM((c->>'custo_vet')::integer), 0) + v_commander.custo_vet INTO v_total_cost
  FROM jsonb_array_elements(v_commanders) c;
  
  -- Adicionar custo dos atributos
  IF p_player_number = 1 AND v_state.player1_army_attributes IS NOT NULL THEN
    v_total_cost := v_total_cost + (
      COALESCE((v_state.player1_army_attributes->>'attack')::integer, 0) +
      COALESCE((v_state.player1_army_attributes->>'defense')::integer, 0) +
      COALESCE((v_state.player1_army_attributes->>'mobility')::integer, 0)
    ) * 5;
  ELSIF p_player_number = 2 AND v_state.player2_army_attributes IS NOT NULL THEN
    v_total_cost := v_total_cost + (
      COALESCE((v_state.player2_army_attributes->>'attack')::integer, 0) +
      COALESCE((v_state.player2_army_attributes->>'defense')::integer, 0) +
      COALESCE((v_state.player2_army_attributes->>'mobility')::integer, 0)
    ) * 5;
  END IF;
  
  IF v_total_cost > v_vet_remaining THEN
    RAISE EXCEPTION 'VET insuficiente. Custo total: %, VET disponível: %', v_total_cost, v_vet_remaining;
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
  IF p_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_commanders = v_commanders,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_commanders = v_commanders,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, p_player_number, 'add_commander', 
    jsonb_build_object('commander_id', p_commander_id, 'custo_vet', v_commander.custo_vet), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'commander_count', v_commander_count + 1,
    'total_committed', v_total_cost
  );
END;
$function$;

-- =============================================
-- RPC: remove_commander
-- Remove um comandante do exército
-- =============================================
CREATE OR REPLACE FUNCTION public.remove_commander(
  p_room_id uuid,
  p_player_number integer,
  p_commander_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_commanders jsonb;
  v_general_id uuid;
  v_new_commanders jsonb := '[]'::jsonb;
  v_elem jsonb;
  v_new_version INTEGER;
BEGIN
  -- Buscar estado atual
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Pegar comandantes e general atuais
  IF p_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_general_id := v_state.player1_general_id;
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_general_id := v_state.player2_general_id;
  END IF;
  
  -- Remover comandante da lista
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
  
  -- Salvar
  IF p_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_commanders = v_new_commanders,
      player1_general_id = v_general_id,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_commanders = v_new_commanders,
      player2_general_id = v_general_id,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, p_player_number, 'remove_commander', 
    jsonb_build_object('commander_id', p_commander_id), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'general_cleared', v_general_id IS NULL AND v_state.player1_general_id = p_commander_id
  );
END;
$function$;

-- =============================================
-- RPC: set_general
-- Define qual comandante é o general
-- =============================================
CREATE OR REPLACE FUNCTION public.set_general(
  p_room_id uuid,
  p_player_number integer,
  p_commander_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_commanders jsonb;
  v_found BOOLEAN := false;
  v_elem jsonb;
  v_new_version INTEGER;
BEGIN
  -- Buscar estado atual
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Pegar comandantes atuais
  IF p_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
  END IF;
  
  -- Verificar se comandante existe na lista
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
  
  -- Salvar
  IF p_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_general_id = p_commander_id,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_general_id = p_commander_id,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, p_player_number, 'set_general', 
    jsonb_build_object('commander_id', p_commander_id), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version);
END;
$function$;

-- =============================================
-- RPC: add_card_to_deck
-- Adiciona uma carta ao deck
-- =============================================
CREATE OR REPLACE FUNCTION public.add_card_to_deck(
  p_room_id uuid,
  p_player_number integer,
  p_card_id uuid,
  p_category text -- 'offensive', 'defensive', 'initiative', 'reactions'
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_card RECORD;
  v_deck jsonb;
  v_category_cards jsonb;
  v_category_count INTEGER;
  v_limit INTEGER;
  v_attack INTEGER;
  v_defense INTEGER;
  v_mobility INTEGER;
  v_total_cost INTEGER := 0;
  v_vet_remaining INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Buscar estado atual
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
  IF p_player_number = 1 THEN
    v_deck := COALESCE(v_state.player1_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
    v_vet_remaining := v_state.player1_vet_remaining;
    v_attack := COALESCE((v_state.player1_army_attributes->>'attack')::integer, 0);
    v_defense := COALESCE((v_state.player1_army_attributes->>'defense')::integer, 0);
    v_mobility := COALESCE((v_state.player1_army_attributes->>'mobility')::integer, 0);
  ELSE
    v_deck := COALESCE(v_state.player2_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
    v_vet_remaining := v_state.player2_vet_remaining;
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
  
  -- Pegar cartas da categoria
  v_category_cards := COALESCE(v_deck->p_category, '[]'::jsonb);
  v_category_count := jsonb_array_length(v_category_cards);
  
  -- Verificar limite
  IF v_category_count >= v_limit THEN
    RAISE EXCEPTION 'Limite de % cartas % atingido', v_limit, p_category;
  END IF;
  
  -- Verificar cópia única (em todas as categorias)
  IF (v_deck->'offensive') @> jsonb_build_array(jsonb_build_object('id', p_card_id::text)) OR
     (v_deck->'defensive') @> jsonb_build_array(jsonb_build_object('id', p_card_id::text)) OR
     (v_deck->'initiative') @> jsonb_build_array(jsonb_build_object('id', p_card_id::text)) OR
     (v_deck->'reactions') @> jsonb_build_array(jsonb_build_object('id', p_card_id::text)) THEN
    RAISE EXCEPTION 'Carta já está no deck (máximo 1 cópia)';
  END IF;
  
  -- Calcular custo total
  SELECT COALESCE(SUM((card->>'vet_cost')::integer), 0) INTO v_total_cost
  FROM jsonb_array_elements(
    COALESCE(v_deck->'offensive', '[]'::jsonb) ||
    COALESCE(v_deck->'defensive', '[]'::jsonb) ||
    COALESCE(v_deck->'initiative', '[]'::jsonb) ||
    COALESCE(v_deck->'reactions', '[]'::jsonb)
  ) card;
  
  v_total_cost := v_total_cost + COALESCE(v_card.vet_cost, v_card.vet_cost_override, 1);
  
  -- Adicionar custo dos atributos e comandantes
  v_total_cost := v_total_cost + (v_attack + v_defense + v_mobility) * 5;
  
  IF p_player_number = 1 THEN
    SELECT v_total_cost + COALESCE(SUM((c->>'custo_vet')::integer), 0) INTO v_total_cost
    FROM jsonb_array_elements(COALESCE(v_state.player1_commanders, '[]'::jsonb)) c;
  ELSE
    SELECT v_total_cost + COALESCE(SUM((c->>'custo_vet')::integer), 0) INTO v_total_cost
    FROM jsonb_array_elements(COALESCE(v_state.player2_commanders, '[]'::jsonb)) c;
  END IF;
  
  IF v_total_cost > v_vet_remaining THEN
    RAISE EXCEPTION 'VET insuficiente. Custo total: %, VET disponível: %', v_total_cost, v_vet_remaining;
  END IF;
  
  -- Adicionar carta
  v_category_cards := v_category_cards || jsonb_build_array(jsonb_build_object(
    'id', p_card_id,
    'name', v_card.name,
    'vet_cost', COALESCE(v_card.vet_cost_override, v_card.vet_cost),
    'unit_type', v_card.unit_type,
    'attack_bonus', v_card.attack_bonus,
    'defense_bonus', v_card.defense_bonus,
    'mobility_bonus', v_card.mobility_bonus
  ));
  
  v_deck := jsonb_set(v_deck, ARRAY[p_category], v_category_cards);
  
  -- Salvar
  IF p_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_deck = v_deck,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_deck = v_deck,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, p_player_number, 'add_card', 
    jsonb_build_object('card_id', p_card_id, 'category', p_category, 'vet_cost', v_card.vet_cost), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'category_count', v_category_count + 1,
    'category_limit', v_limit
  );
END;
$function$;

-- =============================================
-- RPC: remove_card_from_deck
-- Remove uma carta do deck
-- =============================================
CREATE OR REPLACE FUNCTION public.remove_card_from_deck(
  p_room_id uuid,
  p_player_number integer,
  p_card_id uuid,
  p_category text
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_deck jsonb;
  v_category_cards jsonb;
  v_new_cards jsonb := '[]'::jsonb;
  v_elem jsonb;
  v_new_version INTEGER;
BEGIN
  -- Buscar estado atual
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Pegar deck atual
  IF p_player_number = 1 THEN
    v_deck := COALESCE(v_state.player1_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
  ELSE
    v_deck := COALESCE(v_state.player2_deck, '{"offensive":[],"defensive":[],"initiative":[],"reactions":[]}'::jsonb);
  END IF;
  
  -- Pegar cartas da categoria
  v_category_cards := COALESCE(v_deck->p_category, '[]'::jsonb);
  
  -- Remover carta
  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_category_cards)
  LOOP
    IF (v_elem->>'id')::uuid != p_card_id THEN
      v_new_cards := v_new_cards || jsonb_build_array(v_elem);
    END IF;
  END LOOP;
  
  v_deck := jsonb_set(v_deck, ARRAY[p_category], v_new_cards);
  
  -- Salvar
  IF p_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_deck = v_deck,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_deck = v_deck,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, p_player_number, 'remove_card', 
    jsonb_build_object('card_id', p_card_id, 'category', p_category), 
    'deckbuilding', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version);
END;
$function$;

-- =============================================
-- RPC: confirm_deckbuilding
-- Confirma deckbuilding do jogador
-- =============================================
CREATE OR REPLACE FUNCTION public.confirm_deckbuilding(
  p_room_id uuid,
  p_player_number integer
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_commanders jsonb;
  v_general_id uuid;
  v_attributes jsonb;
  v_both_confirmed BOOLEAN;
  v_new_version INTEGER;
BEGIN
  -- Buscar estado atual
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Pegar dados do jogador
  IF p_player_number = 1 THEN
    v_commanders := COALESCE(v_state.player1_commanders, '[]'::jsonb);
    v_general_id := v_state.player1_general_id;
    v_attributes := v_state.player1_army_attributes;
  ELSE
    v_commanders := COALESCE(v_state.player2_commanders, '[]'::jsonb);
    v_general_id := v_state.player2_general_id;
    v_attributes := v_state.player2_army_attributes;
  END IF;
  
  -- Validar: precisa ter pelo menos 1 comandante
  IF jsonb_array_length(v_commanders) < 1 THEN
    RAISE EXCEPTION 'Precisa ter pelo menos 1 comandante';
  END IF;
  
  -- Validar: precisa ter general definido
  IF v_general_id IS NULL THEN
    RAISE EXCEPTION 'Precisa definir um General';
  END IF;
  
  -- Confirmar
  IF p_player_number = 1 THEN
    UPDATE public.match_state
    SET 
      player1_deck_confirmed = true,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  ELSE
    UPDATE public.match_state
    SET 
      player2_deck_confirmed = true,
      version = version + 1,
      updated_at = now()
    WHERE room_id = p_room_id
    RETURNING version INTO v_new_version;
  END IF;
  
  -- Registrar ação
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, p_player_number, 'confirm_deckbuilding', 
    jsonb_build_object('commanders_count', jsonb_array_length(v_commanders), 'general_id', v_general_id), 
    'deckbuilding', v_new_version);
  
  -- Verificar se ambos confirmaram
  SELECT (player1_deck_confirmed AND player2_deck_confirmed) INTO v_both_confirmed
  FROM public.match_state
  WHERE room_id = p_room_id;
  
  -- Se ambos confirmaram, avançar fase para combat_setup
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
    'both_confirmed', v_both_confirmed
  );
END;
$function$;