-- Fix join_room to allow joining rooms that are 'waiting' OR 'ready' (but not full)
CREATE OR REPLACE FUNCTION public.join_room(
  p_room_code TEXT,
  p_nickname TEXT,
  p_session_id TEXT
)
RETURNS TABLE(room_id UUID, player_id UUID, player_number INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_player_id UUID;
  v_player_count INTEGER;
  v_room_status room_status;
  v_existing_player room_players%ROWTYPE;
BEGIN
  -- Buscar sala
  SELECT r.id, r.status INTO v_room_id, v_room_status
  FROM public.rooms r
  WHERE r.code = UPPER(p_room_code);
  
  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Sala não encontrada';
  END IF;
  
  -- Allow joining if status is 'waiting' or 'ready' (before game starts)
  IF v_room_status NOT IN ('waiting', 'ready') THEN
    RAISE EXCEPTION 'Sala não está aceitando jogadores';
  END IF;
  
  -- Check if this session is already in the room
  SELECT * INTO v_existing_player
  FROM public.room_players rp
  WHERE rp.room_id = v_room_id AND rp.session_id = p_session_id;
  
  IF v_existing_player IS NOT NULL THEN
    -- Already in room, return existing data
    RETURN QUERY SELECT v_room_id, v_existing_player.id, v_existing_player.player_number::INTEGER;
    RETURN;
  END IF;
  
  -- Contar jogadores
  SELECT COUNT(*) INTO v_player_count
  FROM public.room_players rp
  WHERE rp.room_id = v_room_id;
  
  IF v_player_count >= 2 THEN
    RAISE EXCEPTION 'Sala está cheia';
  END IF;
  
  -- Adicionar como jogador 2
  INSERT INTO public.room_players (room_id, player_number, nickname, session_id, is_host, status)
  VALUES (v_room_id, 2, p_nickname, p_session_id, false, 'joined')
  RETURNING id INTO v_player_id;
  
  -- Atualizar status da sala para ready (2 jogadores agora)
  UPDATE public.rooms
  SET status = 'ready'
  WHERE id = v_room_id;
  
  RETURN QUERY SELECT v_room_id, v_player_id, 2;
END;
$$;