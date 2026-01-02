-- Fix get_match_state to avoid jsonb_build_object 100 argument limit
-- Using to_jsonb(record) instead of building field by field

CREATE OR REPLACE FUNCTION public.get_match_state(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_room_json JSONB;
  v_state_json JSONB;
  v_players JSONB;
  v_recent_actions JSONB;
BEGIN
  -- Fetch room as JSON directly
  SELECT to_jsonb(r.*) INTO v_room_json
  FROM public.rooms r
  WHERE r.id = p_room_id;
  
  IF v_room_json IS NULL THEN
    RAISE EXCEPTION 'Sala não encontrada';
  END IF;

  -- Fetch match_state as JSON directly
  SELECT to_jsonb(ms.*) INTO v_state_json
  FROM public.match_state ms
  WHERE ms.room_id = p_room_id;
  
  IF v_state_json IS NULL THEN
    RAISE EXCEPTION 'Estado da partida não encontrado';
  END IF;

  -- Build players array
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', rp.id,
      'player_number', rp.player_number,
      'nickname', rp.nickname,
      'status', rp.status,
      'is_host', rp.is_host,
      'session_id', rp.session_id,
      'created_at', rp.created_at,
      'updated_at', rp.updated_at
    ) ORDER BY rp.player_number
  ), '[]'::jsonb) INTO v_players
  FROM public.room_players rp 
  WHERE rp.room_id = p_room_id;

  -- Build recent actions array (last 20)
  SELECT COALESCE(jsonb_agg(action_row ORDER BY created_at_ts DESC), '[]'::jsonb) INTO v_recent_actions
  FROM (
    SELECT 
      jsonb_build_object(
        'id', ma.id,
        'player_number', ma.player_number,
        'action_type', ma.action_type,
        'action_data', ma.action_data,
        'phase', ma.phase,
        'state_version', ma.state_version,
        'created_at', ma.created_at
      ) as action_row,
      ma.created_at as created_at_ts
    FROM public.match_actions ma
    WHERE ma.room_id = p_room_id
    ORDER BY ma.created_at DESC
    LIMIT 20
  ) sub;

  -- Return final object with 4 top-level keys only
  RETURN jsonb_build_object(
    'room', v_room_json,
    'players', v_players,
    'match_state', v_state_json,
    'recent_actions', v_recent_actions
  );
END;
$function$;