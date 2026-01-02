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
  v_recent_actions JSONB;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Sala não encontrada';
  END IF;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  SELECT jsonb_agg(jsonb_build_object(
    'player_number', rp.player_number,
    'nickname', rp.nickname,
    'status', rp.status,
    'is_host', rp.is_host
  )) INTO v_players
  FROM public.room_players rp WHERE rp.room_id = p_room_id;
  
  -- Get recent actions (fixed query)
  SELECT jsonb_agg(sub.action_obj) INTO v_recent_actions
  FROM (
    SELECT jsonb_build_object(
      'id', ma.id,
      'player_number', ma.player_number,
      'action_type', ma.action_type,
      'action_data', ma.action_data,
      'phase', ma.phase,
      'state_version', ma.state_version,
      'created_at', ma.created_at
    ) as action_obj
    FROM public.match_actions ma
    WHERE ma.room_id = p_room_id
    ORDER BY ma.created_at DESC
    LIMIT 20
  ) sub;
  
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
      'vet_agreed', v_state.vet_agreed,
      'logistics_budget', v_state.logistics_budget,
      'player1_culture', v_state.player1_culture,
      'player1_culture_confirmed', v_state.player1_culture_confirmed,
      'player2_culture', v_state.player2_culture,
      'player2_culture_confirmed', v_state.player2_culture_confirmed,
      'scenario_options', v_state.scenario_options,
      'logistics_round', v_state.logistics_round,
      'logistics_resolved', v_state.logistics_resolved,
      'player1_round1_bid', v_state.player1_round1_bid,
      'player2_round1_bid', v_state.player2_round1_bid,
      'player1_round2_bid', v_state.player1_round2_bid,
      'player2_round2_bid', v_state.player2_round2_bid,
      'terrain_tiebreak_eligible', v_state.terrain_tiebreak_eligible,
      'season_tiebreak_eligible', v_state.season_tiebreak_eligible,
      'chosen_terrain_id', v_state.chosen_terrain_id,
      'chosen_season_id', v_state.chosen_season_id,
      'vet_cost_logistics_p1', v_state.vet_cost_logistics_p1,
      'vet_cost_logistics_p2', v_state.vet_cost_logistics_p2,
      'player1_vet_budget', v_state.player1_vet_budget,
      'player2_vet_budget', v_state.player2_vet_budget,
      'player1_vet_spent', v_state.player1_vet_spent,
      'player2_vet_spent', v_state.player2_vet_spent,
      'player1_vet_remaining', v_state.player1_vet_remaining,
      'player2_vet_remaining', v_state.player2_vet_remaining,
      'player1_army_attributes', v_state.player1_army_attributes,
      'player2_army_attributes', v_state.player2_army_attributes,
      'player1_commanders', v_state.player1_commanders,
      'player2_commanders', v_state.player2_commanders,
      'player1_general_id', v_state.player1_general_id,
      'player2_general_id', v_state.player2_general_id,
      'player1_deck', v_state.player1_deck,
      'player2_deck', v_state.player2_deck,
      'player1_deck_confirmed', v_state.player1_deck_confirmed,
      'player2_deck_confirmed', v_state.player2_deck_confirmed,
      'player1_basic_cards_granted', v_state.player1_basic_cards_granted,
      'player2_basic_cards_granted', v_state.player2_basic_cards_granted,
      -- Combat fields
      'combat_round', v_state.combat_round,
      'combat_phase', v_state.combat_phase,
      'player1_hand', v_state.player1_hand,
      'player2_hand', v_state.player2_hand,
      'player1_discard', v_state.player1_discard,
      'player2_discard', v_state.player2_discard,
      'player1_basic_cards_state', v_state.player1_basic_cards_state,
      'player2_basic_cards_state', v_state.player2_basic_cards_state,
      'player1_cmd_state', v_state.player1_cmd_state,
      'player2_cmd_state', v_state.player2_cmd_state,
      'player1_hp', v_state.player1_hp,
      'player2_hp', v_state.player2_hp,
      'player1_deployment_confirmed', v_state.player1_deployment_confirmed,
      'player2_deployment_confirmed', v_state.player2_deployment_confirmed,
      'combat_board_state', v_state.combat_board_state,
      'current_action_stack', v_state.current_action_stack,
      'created_at', v_state.created_at,
      'updated_at', v_state.updated_at
    ),
    'recent_actions', COALESCE(v_recent_actions, '[]'::jsonb)
  );
END;
$function$;