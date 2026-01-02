-- ============================================================================
-- FASE 1: INICIATIVA - CORREÇÃO COMPLETA
-- ============================================================================

-- 1) Adicionar valores ao enum game_phase para subfases de iniciativa
ALTER TYPE game_phase ADD VALUE IF NOT EXISTS 'initiative_maneuver';
ALTER TYPE game_phase ADD VALUE IF NOT EXISTS 'initiative_reaction';
ALTER TYPE game_phase ADD VALUE IF NOT EXISTS 'initiative_roll';
ALTER TYPE game_phase ADD VALUE IF NOT EXISTS 'initiative_post';

-- 2) Adicionar campos de terreno secundário e primeiro atacante ao match_state
ALTER TABLE public.match_state 
ADD COLUMN IF NOT EXISTS chosen_secondary_terrain_id uuid REFERENCES mass_combat_secondary_terrains(id),
ADD COLUMN IF NOT EXISTS first_attacker_player_number integer,
ADD COLUMN IF NOT EXISTS initiative_roll_result jsonb;

-- 3) Popular effect_tag para cartas de manobra (movimentação)
-- Regra: mobility_bonus > 0 OU description menciona "iniciativa" ou "mobilidade" => movimentacao
UPDATE public.mass_combat_tactical_cards
SET effect_tag = 'movimentacao'
WHERE effect_tag IS NULL 
AND (
  mobility_bonus > 0 
  OR description ILIKE '%fase de iniciativa%'
  OR description ILIKE '%mobilidade%'
  OR description ILIKE '%movimento%'
);

-- 4) Marcar cartas de reação (para subfase reaction)
UPDATE public.mass_combat_tactical_cards
SET effect_tag = 'reacao'
WHERE effect_tag IS NULL 
AND (
  description ILIKE '%cancelar%'
  OR description ILIKE '%anule%'
  OR description ILIKE '%ignora%efeito%'
  OR description ILIKE '%contra-ataque%'
);

-- ============================================================================
-- 5) CORRIGIR start_combat: buscar general de player*_commanders (instance_id)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.start_combat(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_room RECORD;
  v_p1_deck jsonb;
  v_p2_deck jsonb;
  v_p1_hand jsonb := '[]'::jsonb;
  v_p2_hand jsonb := '[]'::jsonb;
  v_new_version INTEGER;
  v_initial_board jsonb;
  v_p1_general jsonb;
  v_p2_general jsonb;
  v_p1_cmd_state jsonb;
  v_p2_cmd_state jsonb;
  v_p1_deployed jsonb := '[]'::jsonb;
  v_p2_deployed jsonb := '[]'::jsonb;
  v_p1_commanders_cmd jsonb := '{}'::jsonb;
  v_p2_commanders_cmd jsonb := '{}'::jsonb;
  v_cmd jsonb;
BEGIN
  -- Buscar sala e estado
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  -- IDEMPOTENCY: Se já está em combate, retornar sucesso
  IF v_state.combat_phase IS NOT NULL AND v_state.combat_phase NOT IN ('pre_combat', '') THEN
    RETURN jsonb_build_object(
      'success', true, 
      'version', v_state.version,
      'already_started', true,
      'combat_phase', v_state.combat_phase
    );
  END IF;
  
  -- Verificar se ambos confirmaram deck
  IF NOT (v_state.player1_deck_confirmed AND v_state.player2_deck_confirmed) THEN
    RAISE EXCEPTION 'Ambos jogadores precisam confirmar o deck';
  END IF;
  
  -- ========================================
  -- FIX CRÍTICO: Buscar general DENTRO de player*_commanders usando instance_id
  -- ========================================
  
  -- Player 1: encontrar general no array de commanders
  SELECT elem INTO v_p1_general
  FROM jsonb_array_elements(COALESCE(v_state.player1_commanders, '[]'::jsonb)) elem
  WHERE (elem->>'instance_id')::uuid = v_state.player1_general_id;
  
  IF v_p1_general IS NULL THEN
    -- Fallback: usar primeiro commander como general
    v_p1_general := v_state.player1_commanders->0;
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 1, 'warning', jsonb_build_object('msg', 'General não encontrado, usando primeiro commander'), 'combat', v_state.version);
  END IF;
  
  -- Player 2: encontrar general no array de commanders
  SELECT elem INTO v_p2_general
  FROM jsonb_array_elements(COALESCE(v_state.player2_commanders, '[]'::jsonb)) elem
  WHERE (elem->>'instance_id')::uuid = v_state.player2_general_id;
  
  IF v_p2_general IS NULL THEN
    v_p2_general := v_state.player2_commanders->0;
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 2, 'warning', jsonb_build_object('msg', 'General não encontrado, usando primeiro commander'), 'combat', v_state.version);
  END IF;
  
  -- ========================================
  -- Montar deployed_commanders para cada jogador (públicos)
  -- ========================================
  FOR v_cmd IN SELECT * FROM jsonb_array_elements(COALESCE(v_state.player1_commanders, '[]'::jsonb))
  LOOP
    v_p1_deployed := v_p1_deployed || jsonb_build_array(jsonb_build_object(
      'instance_id', v_cmd->>'instance_id',
      'template_id', v_cmd->>'template_id',
      'numero', v_cmd->>'numero',
      'especializacao', v_cmd->>'especializacao',
      'comando_base', v_cmd->>'comando_base',
      'estrategia', v_cmd->>'estrategia',
      'guarda_current', v_cmd->>'guarda_current',
      'guarda_max', v_cmd->>'guarda_max',
      'is_general', (v_cmd->>'instance_id')::uuid = v_state.player1_general_id
    ));
    
    -- Inicializar CMD por comandante
    v_p1_commanders_cmd := v_p1_commanders_cmd || jsonb_build_object(
      v_cmd->>'instance_id', jsonb_build_object(
        'cmd_total', COALESCE((v_cmd->>'comando_base')::int, 1),
        'cmd_spent', 0,
        'cmd_free', COALESCE((v_cmd->>'comando_base')::int, 1)
      )
    );
  END LOOP;
  
  FOR v_cmd IN SELECT * FROM jsonb_array_elements(COALESCE(v_state.player2_commanders, '[]'::jsonb))
  LOOP
    v_p2_deployed := v_p2_deployed || jsonb_build_array(jsonb_build_object(
      'instance_id', v_cmd->>'instance_id',
      'template_id', v_cmd->>'template_id',
      'numero', v_cmd->>'numero',
      'especializacao', v_cmd->>'especializacao',
      'comando_base', v_cmd->>'comando_base',
      'estrategia', v_cmd->>'estrategia',
      'guarda_current', v_cmd->>'guarda_current',
      'guarda_max', v_cmd->>'guarda_max',
      'is_general', (v_cmd->>'instance_id')::uuid = v_state.player2_general_id
    ));
    
    v_p2_commanders_cmd := v_p2_commanders_cmd || jsonb_build_object(
      v_cmd->>'instance_id', jsonb_build_object(
        'cmd_total', COALESCE((v_cmd->>'comando_base')::int, 1),
        'cmd_spent', 0,
        'cmd_free', COALESCE((v_cmd->>'comando_base')::int, 1)
      )
    );
  END LOOP;
  
  -- ========================================
  -- Inicializar CMD state: general separado + commanders
  -- ========================================
  v_p1_cmd_state := jsonb_build_object(
    'general', jsonb_build_object(
      'instance_id', v_p1_general->>'instance_id',
      'cmd_total', COALESCE((v_p1_general->>'comando_base')::int, 1),
      'cmd_spent', 0,
      'cmd_free', COALESCE((v_p1_general->>'comando_base')::int, 1),
      'strategy_total', COALESCE((v_p1_general->>'estrategia')::int, 1)
    ),
    'commanders', v_p1_commanders_cmd
  );
  
  v_p2_cmd_state := jsonb_build_object(
    'general', jsonb_build_object(
      'instance_id', v_p2_general->>'instance_id',
      'cmd_total', COALESCE((v_p2_general->>'comando_base')::int, 1),
      'cmd_spent', 0,
      'cmd_free', COALESCE((v_p2_general->>'comando_base')::int, 1),
      'strategy_total', COALESCE((v_p2_general->>'estrategia')::int, 1)
    ),
    'commanders', v_p2_commanders_cmd
  );
  
  -- ========================================
  -- Montar mãos a partir do deck
  -- ========================================
  v_p1_deck := COALESCE(v_state.player1_deck, '{}'::jsonb);
  v_p2_deck := COALESCE(v_state.player2_deck, '{}'::jsonb);
  
  v_p1_hand := COALESCE(v_p1_deck->'initiative', '[]'::jsonb) 
            || COALESCE(v_p1_deck->'offensive', '[]'::jsonb)
            || COALESCE(v_p1_deck->'defensive', '[]'::jsonb)
            || COALESCE(v_p1_deck->'reactions', '[]'::jsonb);
  
  v_p2_hand := COALESCE(v_p2_deck->'initiative', '[]'::jsonb) 
            || COALESCE(v_p2_deck->'offensive', '[]'::jsonb)
            || COALESCE(v_p2_deck->'defensive', '[]'::jsonb)
            || COALESCE(v_p2_deck->'reactions', '[]'::jsonb);
  
  -- ========================================
  -- Board inicial com comandantes baixados (públicos)
  -- ========================================
  v_initial_board := jsonb_build_object(
    'step', 'initiative_maneuver',
    'p1', jsonb_build_object(
      'deployed_commanders', v_p1_deployed,
      'general_id', v_state.player1_general_id,
      'maneuver', null,
      'reaction', null,
      'confirmed_maneuver', false,
      'confirmed_reaction', false
    ),
    'p2', jsonb_build_object(
      'deployed_commanders', v_p2_deployed,
      'general_id', v_state.player2_general_id,
      'maneuver', null,
      'reaction', null,
      'confirmed_maneuver', false,
      'confirmed_reaction', false
    ),
    'last_resolution', null,
    'initiative_result', null
  );
  
  -- ========================================
  -- Atualizar match_state
  -- ========================================
  UPDATE public.match_state
  SET 
    combat_phase = 'initiative_maneuver',
    combat_round = 1,
    combat_board_state = v_initial_board,
    player1_hand = v_p1_hand,
    player2_hand = v_p2_hand,
    player1_discard = '[]'::jsonb,
    player2_discard = '[]'::jsonb,
    player1_hp = 100,
    player2_hp = 100,
    player1_cmd_state = v_p1_cmd_state,
    player2_cmd_state = v_p2_cmd_state,
    chosen_secondary_terrain_id = null,
    first_attacker_player_number = null,
    initiative_roll_result = null,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Atualizar fase da sala
  UPDATE public.rooms 
  SET current_phase = 'combat', status = 'in_progress', updated_at = now() 
  WHERE id = p_room_id;
  
  -- Log detalhado
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'start_combat', jsonb_build_object(
    'combat_round', 1,
    'combat_phase', 'initiative_maneuver',
    'p1_general', v_p1_general,
    'p2_general', v_p2_general,
    'p1_hand_size', jsonb_array_length(v_p1_hand),
    'p2_hand_size', jsonb_array_length(v_p2_hand),
    'p1_commanders_count', jsonb_array_length(v_p1_deployed),
    'p2_commanders_count', jsonb_array_length(v_p2_deployed)
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'combat_phase', 'initiative_maneuver',
    'p1_hand_size', jsonb_array_length(v_p1_hand),
    'p2_hand_size', jsonb_array_length(v_p2_hand),
    'p1_commanders_deployed', jsonb_array_length(v_p1_deployed),
    'p2_commanders_deployed', jsonb_array_length(v_p2_deployed)
  );
END;
$function$;

-- Overload com session_id
CREATE OR REPLACE FUNCTION public.start_combat(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.start_combat(p_room_id);
END;
$function$;

-- ============================================================================
-- 6) RPC: select_maneuver_card - Selecionar carta de manobra vinculada a comandante
-- ============================================================================
CREATE OR REPLACE FUNCTION public.select_maneuver_card(
  p_room_id uuid,
  p_session_id text,
  p_card_index integer,
  p_commander_instance_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_hand jsonb;
  v_card jsonb;
  v_board jsonb;
  v_player_key text;
  v_cmd_state jsonb;
  v_commander_cmd jsonb;
  v_card_cmd_req INTEGER;
  v_new_version INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  -- Validar fase
  IF v_state.combat_phase != 'initiative_maneuver' THEN 
    RAISE EXCEPTION 'Não está na subfase de manobras. Fase atual: %', v_state.combat_phase; 
  END IF;
  
  -- Pegar mão e cmd_state
  IF v_player_number = 1 THEN
    v_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
    v_cmd_state := v_state.player1_cmd_state;
  ELSE
    v_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
    v_cmd_state := v_state.player2_cmd_state;
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  -- Se card_index é NULL, limpar manobra
  IF p_card_index IS NULL THEN
    v_board := jsonb_set(v_board, ARRAY[v_player_key, 'maneuver'], 'null'::jsonb);
    UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() 
    WHERE room_id = p_room_id RETURNING version INTO v_new_version;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, v_player_number, 'clear_maneuver', '{}'::jsonb, 'combat', v_new_version);
    
    RETURN jsonb_build_object('success', true, 'version', v_new_version);
  END IF;
  
  -- Validar índice
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN 
    RAISE EXCEPTION 'Índice de carta inválido'; 
  END IF;
  
  v_card := v_hand->p_card_index;
  
  -- TODO: Validar effect_tag = 'movimentacao' (relaxado por enquanto para testes)
  -- IF COALESCE(v_card->>'effect_tag', '') != 'movimentacao' THEN
  --   RAISE EXCEPTION 'Esta carta não é de manobra';
  -- END IF;
  
  -- Verificar se comandante existe
  v_commander_cmd := v_cmd_state->'commanders'->p_commander_instance_id::text;
  IF v_commander_cmd IS NULL THEN
    RAISE EXCEPTION 'Comandante não encontrado: %', p_commander_instance_id;
  END IF;
  
  -- Verificar CMD disponível do comandante
  v_card_cmd_req := COALESCE((v_card->>'command_required')::int, 1);
  IF COALESCE((v_commander_cmd->>'cmd_free')::int, 0) < v_card_cmd_req THEN
    RAISE EXCEPTION 'CMD insuficiente no comandante. Requer: %, Disponível: %', 
      v_card_cmd_req, (v_commander_cmd->>'cmd_free')::int;
  END IF;
  
  -- Salvar manobra vinculada ao comandante
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'maneuver'], jsonb_build_object(
    'card', v_card,
    'card_index', p_card_index,
    'commander_instance_id', p_commander_instance_id,
    'cmd_cost', v_card_cmd_req
  ));
  
  UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() 
  WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'select_maneuver', jsonb_build_object(
    'card_name', v_card->>'name',
    'commander_id', p_commander_instance_id,
    'cmd_cost', v_card_cmd_req
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'card', v_card);
END;
$function$;

-- ============================================================================
-- 7) RPC: confirm_maneuver - Confirmar manobra e consumir CMD do comandante
-- ============================================================================
CREATE OR REPLACE FUNCTION public.confirm_maneuver(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_board jsonb;
  v_player_key text;
  v_cmd_state jsonb;
  v_maneuver jsonb;
  v_commander_id text;
  v_cmd_cost INTEGER;
  v_new_version INTEGER;
  v_both_confirmed BOOLEAN;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'initiative_maneuver' THEN 
    RAISE EXCEPTION 'Não está na subfase de manobras'; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  -- Verificar se já confirmou
  IF (v_board->v_player_key->>'confirmed_maneuver')::boolean THEN
    RAISE EXCEPTION 'Manobra já confirmada';
  END IF;
  
  v_maneuver := v_board->v_player_key->'maneuver';
  
  -- Se tem manobra, consumir CMD do comandante
  IF v_maneuver IS NOT NULL AND v_maneuver != 'null'::jsonb THEN
    v_commander_id := v_maneuver->>'commander_instance_id';
    v_cmd_cost := COALESCE((v_maneuver->>'cmd_cost')::int, 1);
    
    -- Atualizar CMD do comandante
    IF v_player_number = 1 THEN
      v_cmd_state := v_state.player1_cmd_state;
    ELSE
      v_cmd_state := v_state.player2_cmd_state;
    END IF;
    
    -- Gastar CMD
    v_cmd_state := jsonb_set(
      v_cmd_state, 
      ARRAY['commanders', v_commander_id, 'cmd_spent'], 
      to_jsonb(COALESCE((v_cmd_state->'commanders'->v_commander_id->>'cmd_spent')::int, 0) + v_cmd_cost)
    );
    v_cmd_state := jsonb_set(
      v_cmd_state, 
      ARRAY['commanders', v_commander_id, 'cmd_free'], 
      to_jsonb(GREATEST(COALESCE((v_cmd_state->'commanders'->v_commander_id->>'cmd_free')::int, 0) - v_cmd_cost, 0))
    );
    
    -- Salvar cmd_state atualizado
    IF v_player_number = 1 THEN
      UPDATE public.match_state SET player1_cmd_state = v_cmd_state WHERE room_id = p_room_id;
    ELSE
      UPDATE public.match_state SET player2_cmd_state = v_cmd_state WHERE room_id = p_room_id;
    END IF;
  END IF;
  
  -- Marcar como confirmado
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'confirmed_maneuver'], 'true'::jsonb);
  
  UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() 
  WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  
  -- Verificar se ambos confirmaram
  v_both_confirmed := (v_board->'p1'->>'confirmed_maneuver')::boolean AND (v_board->'p2'->>'confirmed_maneuver')::boolean;
  
  -- Se ambos confirmaram, avançar para reaction
  IF v_both_confirmed THEN
    UPDATE public.match_state SET combat_phase = 'initiative_reaction', version = version + 1 WHERE room_id = p_room_id;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 0, 'phase_advance', jsonb_build_object('new_phase', 'initiative_reaction'), 'combat', v_new_version + 1);
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'confirm_maneuver', jsonb_build_object(
    'maneuver', v_maneuver,
    'both_confirmed', v_both_confirmed
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'both_confirmed', v_both_confirmed);
END;
$function$;

-- ============================================================================
-- 8) RPC: select_reaction_card - Selecionar reação (vincula ao GENERAL)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.select_reaction_card(
  p_room_id uuid,
  p_session_id text,
  p_card_index integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_hand jsonb;
  v_card jsonb;
  v_board jsonb;
  v_player_key text;
  v_cmd_state jsonb;
  v_general_cmd_free INTEGER;
  v_card_cmd_req INTEGER;
  v_new_version INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'initiative_reaction' THEN 
    RAISE EXCEPTION 'Não está na subfase de reação'; 
  END IF;
  
  IF v_player_number = 1 THEN
    v_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
    v_cmd_state := v_state.player1_cmd_state;
  ELSE
    v_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
    v_cmd_state := v_state.player2_cmd_state;
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  -- Se card_index é NULL, limpar reação (passar)
  IF p_card_index IS NULL THEN
    v_board := jsonb_set(v_board, ARRAY[v_player_key, 'reaction'], 'null'::jsonb);
    UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() 
    WHERE room_id = p_room_id RETURNING version INTO v_new_version;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, v_player_number, 'pass_reaction', '{}'::jsonb, 'combat', v_new_version);
    
    RETURN jsonb_build_object('success', true, 'version', v_new_version, 'passed', true);
  END IF;
  
  -- Validar índice
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN 
    RAISE EXCEPTION 'Índice de carta inválido'; 
  END IF;
  
  v_card := v_hand->p_card_index;
  
  -- Verificar CMD do GENERAL
  v_general_cmd_free := COALESCE((v_cmd_state->'general'->>'cmd_free')::int, 0);
  v_card_cmd_req := COALESCE((v_card->>'command_required')::int, 1);
  
  IF v_general_cmd_free < v_card_cmd_req THEN
    RAISE EXCEPTION 'CMD do General insuficiente. Requer: %, Disponível: %', v_card_cmd_req, v_general_cmd_free;
  END IF;
  
  -- Salvar reação vinculada ao general
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'reaction'], jsonb_build_object(
    'card', v_card,
    'card_index', p_card_index,
    'cmd_cost', v_card_cmd_req
  ));
  
  UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() 
  WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'select_reaction', jsonb_build_object(
    'card_name', v_card->>'name',
    'cmd_cost', v_card_cmd_req
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'card', v_card);
END;
$function$;

-- ============================================================================
-- 9) RPC: confirm_reaction - Confirmar reação e consumir CMD do GENERAL
-- ============================================================================
CREATE OR REPLACE FUNCTION public.confirm_reaction(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_board jsonb;
  v_player_key text;
  v_cmd_state jsonb;
  v_reaction jsonb;
  v_cmd_cost INTEGER;
  v_new_version INTEGER;
  v_both_confirmed BOOLEAN;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'initiative_reaction' THEN 
    RAISE EXCEPTION 'Não está na subfase de reação'; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  IF (v_board->v_player_key->>'confirmed_reaction')::boolean THEN
    RAISE EXCEPTION 'Reação já confirmada';
  END IF;
  
  v_reaction := v_board->v_player_key->'reaction';
  
  -- Se tem reação, consumir CMD do GENERAL
  IF v_reaction IS NOT NULL AND v_reaction != 'null'::jsonb THEN
    v_cmd_cost := COALESCE((v_reaction->>'cmd_cost')::int, 1);
    
    IF v_player_number = 1 THEN
      v_cmd_state := v_state.player1_cmd_state;
    ELSE
      v_cmd_state := v_state.player2_cmd_state;
    END IF;
    
    -- Gastar CMD do general
    v_cmd_state := jsonb_set(
      v_cmd_state, 
      ARRAY['general', 'cmd_spent'], 
      to_jsonb(COALESCE((v_cmd_state->'general'->>'cmd_spent')::int, 0) + v_cmd_cost)
    );
    v_cmd_state := jsonb_set(
      v_cmd_state, 
      ARRAY['general', 'cmd_free'], 
      to_jsonb(GREATEST(COALESCE((v_cmd_state->'general'->>'cmd_free')::int, 0) - v_cmd_cost, 0))
    );
    
    IF v_player_number = 1 THEN
      UPDATE public.match_state SET player1_cmd_state = v_cmd_state WHERE room_id = p_room_id;
    ELSE
      UPDATE public.match_state SET player2_cmd_state = v_cmd_state WHERE room_id = p_room_id;
    END IF;
  END IF;
  
  -- Marcar como confirmado
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'confirmed_reaction'], 'true'::jsonb);
  
  UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() 
  WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  
  v_both_confirmed := (v_board->'p1'->>'confirmed_reaction')::boolean AND (v_board->'p2'->>'confirmed_reaction')::boolean;
  
  -- Se ambos confirmaram, avançar para initiative_roll
  IF v_both_confirmed THEN
    UPDATE public.match_state SET combat_phase = 'initiative_roll', version = version + 1 WHERE room_id = p_room_id;
    
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 0, 'phase_advance', jsonb_build_object('new_phase', 'initiative_roll'), 'combat', v_new_version + 1);
  END IF;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'confirm_reaction', jsonb_build_object(
    'reaction', v_reaction,
    'both_confirmed', v_both_confirmed
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'both_confirmed', v_both_confirmed);
END;
$function$;

-- ============================================================================
-- 10) RPC: resolve_initiative_roll - Rolagem contestada 1d20 + strategy + mobility + mods
-- ============================================================================
CREATE OR REPLACE FUNCTION public.resolve_initiative_roll(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_state RECORD;
  v_board jsonb;
  v_p1_d20 INTEGER;
  v_p2_d20 INTEGER;
  v_p1_strategy INTEGER;
  v_p2_strategy INTEGER;
  v_p1_mobility INTEGER;
  v_p2_mobility INTEGER;
  v_p1_mods INTEGER;
  v_p2_mods INTEGER;
  v_p1_total INTEGER;
  v_p2_total INTEGER;
  v_winner INTEGER;
  v_result jsonb;
  v_new_version INTEGER;
  v_reroll_count INTEGER := 0;
BEGIN
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'initiative_roll' THEN 
    RAISE EXCEPTION 'Não está na fase de rolagem de iniciativa'; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  -- Dados
  v_p1_strategy := COALESCE((v_state.player1_cmd_state->'general'->>'strategy_total')::int, 1);
  v_p2_strategy := COALESCE((v_state.player2_cmd_state->'general'->>'strategy_total')::int, 1);
  
  v_p1_mobility := COALESCE((v_state.player1_army_attributes->>'mobility')::int, 0);
  v_p2_mobility := COALESCE((v_state.player2_army_attributes->>'mobility')::int, 0);
  
  -- Modificadores das cartas de manobra (mobility_bonus)
  v_p1_mods := COALESCE((v_board->'p1'->'maneuver'->'card'->>'mobility_bonus')::int, 0);
  v_p2_mods := COALESCE((v_board->'p2'->'maneuver'->'card'->>'mobility_bonus')::int, 0);
  
  -- Rolagem com reroll em caso de empate (máx 3 tentativas)
  LOOP
    v_p1_d20 := floor(random() * 20 + 1)::int;
    v_p2_d20 := floor(random() * 20 + 1)::int;
    
    v_p1_total := v_p1_d20 + v_p1_strategy + v_p1_mobility + v_p1_mods;
    v_p2_total := v_p2_d20 + v_p2_strategy + v_p2_mobility + v_p2_mods;
    
    v_reroll_count := v_reroll_count + 1;
    
    IF v_p1_total != v_p2_total OR v_reroll_count >= 3 THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Determinar vencedor
  IF v_p1_total > v_p2_total THEN
    v_winner := 1;
  ELSIF v_p2_total > v_p1_total THEN
    v_winner := 2;
  ELSE
    -- Empate final: host (P1) vence
    v_winner := 1;
  END IF;
  
  -- Montar resultado
  v_result := jsonb_build_object(
    'p1', jsonb_build_object(
      'd20', v_p1_d20,
      'strategy', v_p1_strategy,
      'mobility', v_p1_mobility,
      'mods', v_p1_mods,
      'total', v_p1_total
    ),
    'p2', jsonb_build_object(
      'd20', v_p2_d20,
      'strategy', v_p2_strategy,
      'mobility', v_p2_mobility,
      'mods', v_p2_mods,
      'total', v_p2_total
    ),
    'winner_player_number', v_winner,
    'reroll_count', v_reroll_count,
    'tie_breaker_used', v_p1_total = v_p2_total
  );
  
  -- Salvar resultado
  v_board := jsonb_set(v_board, ARRAY['initiative_result'], v_result);
  
  UPDATE public.match_state 
  SET 
    combat_board_state = v_board, 
    combat_phase = 'initiative_post',
    initiative_roll_result = v_result,
    version = version + 1, 
    updated_at = now() 
  WHERE room_id = p_room_id 
  RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'initiative_roll', v_result, 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'result', v_result, 'winner', v_winner);
END;
$function$;

-- ============================================================================
-- 11) RPC: choose_secondary_terrain - Vencedor escolhe terreno secundário
-- ============================================================================
CREATE OR REPLACE FUNCTION public.choose_secondary_terrain(
  p_room_id uuid,
  p_session_id text,
  p_secondary_terrain_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_winner INTEGER;
  v_board jsonb;
  v_new_version INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'initiative_post' THEN 
    RAISE EXCEPTION 'Não está na fase pós-iniciativa'; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_winner := COALESCE((v_board->'initiative_result'->>'winner_player_number')::int, 1);
  
  IF v_player_number != v_winner THEN
    RAISE EXCEPTION 'Apenas o vencedor da iniciativa pode escolher o terreno secundário';
  END IF;
  
  -- Salvar escolha
  v_board := jsonb_set(v_board, ARRAY['secondary_terrain_id'], to_jsonb(p_secondary_terrain_id::text));
  
  UPDATE public.match_state 
  SET 
    combat_board_state = v_board, 
    chosen_secondary_terrain_id = p_secondary_terrain_id,
    version = version + 1, 
    updated_at = now() 
  WHERE room_id = p_room_id 
  RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'choose_secondary_terrain', jsonb_build_object(
    'terrain_id', p_secondary_terrain_id
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version);
END;
$function$;

-- ============================================================================
-- 12) RPC: choose_first_attacker - Vencedor escolhe quem ataca primeiro
-- ============================================================================
CREATE OR REPLACE FUNCTION public.choose_first_attacker(
  p_room_id uuid,
  p_session_id text,
  p_attacker_player_number integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_winner INTEGER;
  v_board jsonb;
  v_new_version INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  
  IF v_state.combat_phase != 'initiative_post' THEN 
    RAISE EXCEPTION 'Não está na fase pós-iniciativa'; 
  END IF;
  
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  v_winner := COALESCE((v_board->'initiative_result'->>'winner_player_number')::int, 1);
  
  IF v_player_number != v_winner THEN
    RAISE EXCEPTION 'Apenas o vencedor da iniciativa pode escolher quem ataca primeiro';
  END IF;
  
  IF p_attacker_player_number NOT IN (1, 2) THEN
    RAISE EXCEPTION 'Jogador inválido';
  END IF;
  
  -- Verificar se terreno já foi escolhido
  IF v_state.chosen_secondary_terrain_id IS NULL THEN
    RAISE EXCEPTION 'Escolha o terreno secundário primeiro';
  END IF;
  
  -- Salvar escolha e avançar para combate
  v_board := jsonb_set(v_board, ARRAY['first_attacker_player_number'], to_jsonb(p_attacker_player_number));
  
  UPDATE public.match_state 
  SET 
    combat_board_state = v_board, 
    first_attacker_player_number = p_attacker_player_number,
    combat_phase = 'combat',  -- Avançar para Fase 2
    version = version + 1, 
    updated_at = now() 
  WHERE room_id = p_room_id 
  RETURNING version INTO v_new_version;
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, v_player_number, 'choose_first_attacker', jsonb_build_object(
    'first_attacker', p_attacker_player_number
  ), 'combat', v_new_version);
  
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'phase_advance', jsonb_build_object(
    'new_phase', 'combat',
    'phase1_complete', true
  ), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'phase1_complete', true);
END;
$function$;