-- ====================================================================
-- IDEMPOTENT start_combat - não reinicia se já está em combate
-- ====================================================================
CREATE OR REPLACE FUNCTION public.start_combat(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state RECORD;
  v_room RECORD;
  v_p1_deck jsonb;
  v_p2_deck jsonb;
  v_p1_hand jsonb := '[]'::jsonb;
  v_p2_hand jsonb := '[]'::jsonb;
  v_new_version INTEGER;
  v_initial_board jsonb;
  v_p1_general RECORD;
  v_p2_general RECORD;
  v_p1_cmd_state jsonb;
  v_p2_cmd_state jsonb;
BEGIN
  -- Buscar sala e estado
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado não encontrado';
  END IF;
  
  -- ========================================
  -- IDEMPOTENCY CHECK: Se já está em combate, retornar sucesso sem re-executar
  -- ========================================
  IF v_state.combat_phase IS NOT NULL AND v_state.combat_phase NOT IN ('pre_combat', '') THEN
    RETURN jsonb_build_object(
      'success', true, 
      'version', v_state.version,
      'already_started', true,
      'combat_phase', v_state.combat_phase,
      'p1_hand_size', jsonb_array_length(COALESCE(v_state.player1_hand, '[]'::jsonb)),
      'p2_hand_size', jsonb_array_length(COALESCE(v_state.player2_hand, '[]'::jsonb))
    );
  END IF;
  
  -- Verificar se ambos confirmaram deck
  IF NOT (v_state.player1_deck_confirmed AND v_state.player2_deck_confirmed) THEN
    RAISE EXCEPTION 'Ambos jogadores precisam confirmar o deck';
  END IF;
  
  -- Montar mãos diretamente a partir dos decks (todas as cartas ficam disponíveis)
  -- Player 1
  v_p1_deck := COALESCE(v_state.player1_deck, '{}'::jsonb);
  v_p1_hand := COALESCE(v_p1_deck->'initiative', '[]'::jsonb) 
            || COALESCE(v_p1_deck->'offensive', '[]'::jsonb)
            || COALESCE(v_p1_deck->'defensive', '[]'::jsonb)
            || COALESCE(v_p1_deck->'reactions', '[]'::jsonb);
  
  -- Player 2
  v_p2_deck := COALESCE(v_state.player2_deck, '{}'::jsonb);
  v_p2_hand := COALESCE(v_p2_deck->'initiative', '[]'::jsonb) 
            || COALESCE(v_p2_deck->'offensive', '[]'::jsonb)
            || COALESCE(v_p2_deck->'defensive', '[]'::jsonb)
            || COALESCE(v_p2_deck->'reactions', '[]'::jsonb);
  
  -- Log warning se deck vazio (mas continuar)
  IF jsonb_array_length(v_p1_hand) = 0 THEN
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 1, 'warning_empty_deck', jsonb_build_object('message', 'Player 1 deck vazio'), 'deckbuilding', v_state.version);
  END IF;
  
  IF jsonb_array_length(v_p2_hand) = 0 THEN
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
    VALUES (p_room_id, 2, 'warning_empty_deck', jsonb_build_object('message', 'Player 2 deck vazio'), 'deckbuilding', v_state.version);
  END IF;
  
  -- Buscar general de cada jogador para CMD inicial
  SELECT * INTO v_p1_general FROM public.mass_combat_commander_templates 
  WHERE id = v_state.player1_general_id;
  
  SELECT * INTO v_p2_general FROM public.mass_combat_commander_templates 
  WHERE id = v_state.player2_general_id;
  
  -- Inicializar CMD state
  v_p1_cmd_state := jsonb_build_object(
    'general', jsonb_build_object(
      'cmd_total', COALESCE(v_p1_general.comando, 3),
      'cmd_spent', 0,
      'cmd_free', COALESCE(v_p1_general.comando, 3)
    ),
    'commanders', '{}'::jsonb
  );
  
  v_p2_cmd_state := jsonb_build_object(
    'general', jsonb_build_object(
      'cmd_total', COALESCE(v_p2_general.comando, 3),
      'cmd_spent', 0,
      'cmd_free', COALESCE(v_p2_general.comando, 3)
    ),
    'commanders', '{}'::jsonb
  );
  
  -- Estrutura inicial do board
  v_initial_board := jsonb_build_object(
    'step', 'initiative',
    'p1', jsonb_build_object(
      'initiative_card', null,
      'main_card', null,
      'confirmed', false
    ),
    'p2', jsonb_build_object(
      'initiative_card', null,
      'main_card', null,
      'confirmed', false
    ),
    'last_resolution', null
  );
  
  -- Atualizar match_state
  UPDATE public.match_state
  SET 
    combat_phase = 'initiative',
    combat_round = 1,
    combat_board_state = v_initial_board,
    player1_hand = v_p1_hand,
    player2_hand = v_p2_hand,
    player1_discard = '[]'::jsonb,
    player2_discard = '[]'::jsonb,
    player1_cmd_state = v_p1_cmd_state,
    player2_cmd_state = v_p2_cmd_state,
    player1_hp = 100,
    player2_hp = 100,
    player1_basic_cards_state = '{"attack":false,"defense":false,"initiative":false,"heal":false,"countermaneuver":false}'::jsonb,
    player2_basic_cards_state = '{"attack":false,"defense":false,"initiative":false,"heal":false,"countermaneuver":false}'::jsonb,
    version = version + 1,
    updated_at = now()
  WHERE room_id = p_room_id
  RETURNING version INTO v_new_version;
  
  -- Atualizar fase da sala
  UPDATE public.rooms
  SET 
    current_phase = 'combat',
    updated_at = now()
  WHERE id = p_room_id;
  
  -- Registrar action
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version)
  VALUES (p_room_id, 0, 'start_combat', 
    jsonb_build_object(
      'from_phase', 'deckbuilding', 
      'to_phase', 'combat',
      'p1_hand_size', jsonb_array_length(v_p1_hand),
      'p2_hand_size', jsonb_array_length(v_p2_hand),
      'p1_general_cmd', COALESCE(v_p1_general.comando, 3),
      'p2_general_cmd', COALESCE(v_p2_general.comando, 3)
    ),
    'combat', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'already_started', false,
    'p1_hand_size', jsonb_array_length(v_p1_hand),
    'p2_hand_size', jsonb_array_length(v_p2_hand)
  );
END;
$$;