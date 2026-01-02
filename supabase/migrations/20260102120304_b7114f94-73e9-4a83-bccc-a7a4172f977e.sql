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

  -- IMPORTANT: use to_jsonb(record) to avoid jsonb_build_object argument limit (100)
  RETURN jsonb_build_object(
    'room', to_jsonb(v_room),
    'players', COALESCE(v_players, '[]'::jsonb),
    'match_state', to_jsonb(v_state),
    'recent_actions', COALESCE(v_recent_actions, '[]'::jsonb)
  );
END;
$function$;