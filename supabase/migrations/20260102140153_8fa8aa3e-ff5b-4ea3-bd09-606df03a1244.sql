
-- Recriar start_combat: todas as cartas do deck vão direto para a mão (sem draw_pile)
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
  
  -- Estrutura inicial do board (sem draw_pile)
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
  VALUES (p_room_id, 0, 'phase_advance', 
    jsonb_build_object('from_phase', 'deckbuilding', 'to_phase', 'combat'),
    'combat', v_new_version);
  
  RETURN jsonb_build_object(
    'success', true, 
    'version', v_new_version,
    'p1_hand_size', jsonb_array_length(v_p1_hand),
    'p2_hand_size', jsonb_array_length(v_p2_hand)
  );
END;
$$;
