-- RPC para exportar match_state completo (server-authoritative)
CREATE OR REPLACE FUNCTION public.get_match_state(p_room_id uuid, p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_player RECORD;
  v_room RECORD;
  v_state RECORD;
BEGIN
  -- Validar que session_id pertence à room
  SELECT * INTO v_player
  FROM public.room_players
  WHERE room_id = p_room_id AND session_id = p_session_id;
  
  IF v_player IS NULL THEN
    RAISE EXCEPTION 'Jogador não encontrado nesta sala ou session_id inválido';
  END IF;
  
  -- Buscar room
  SELECT * INTO v_room
  FROM public.rooms
  WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Sala não encontrada';
  END IF;
  
  -- Buscar match_state
  SELECT * INTO v_state
  FROM public.match_state
  WHERE room_id = p_room_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;
  
  -- Retornar tudo
  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'code', v_room.code,
      'host_nickname', v_room.host_nickname,
      'status', v_room.status,
      'current_phase', v_room.current_phase,
      'created_at', v_room.created_at,
      'updated_at', v_room.updated_at
    ),
    'match_state', jsonb_build_object(
      'id', v_state.id,
      'room_id', v_state.room_id,
      'version', v_state.version,
      'game_seed', v_state.game_seed,
      'vet_agreed', v_state.vet_agreed,
      'logistics_budget', v_state.logistics_budget,
      'logistics_round', v_state.logistics_round,
      'logistics_resolved', v_state.logistics_resolved,
      'player1_culture', v_state.player1_culture,
      'player1_culture_confirmed', v_state.player1_culture_confirmed,
      'player2_culture', v_state.player2_culture,
      'player2_culture_confirmed', v_state.player2_culture_confirmed,
      'scenario_options', v_state.scenario_options,
      'player1_round1_bid', v_state.player1_round1_bid,
      'player1_round2_bid', v_state.player1_round2_bid,
      'player2_round1_bid', v_state.player2_round1_bid,
      'player2_round2_bid', v_state.player2_round2_bid,
      'terrain_tiebreak_eligible', v_state.terrain_tiebreak_eligible,
      'season_tiebreak_eligible', v_state.season_tiebreak_eligible,
      'chosen_terrain_id', v_state.chosen_terrain_id,
      'chosen_season_id', v_state.chosen_season_id,
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
      'created_at', v_state.created_at,
      'updated_at', v_state.updated_at
    ),
    'exported_at', now(),
    'exported_by_player', v_player.player_number
  );
END;
$function$;