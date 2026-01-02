
-- Drop funções que precisam de assinatura diferente
DROP FUNCTION IF EXISTS public.select_initiative_card(uuid, text, integer);

-- Recriar select_initiative_card com validação CMD/EST
CREATE OR REPLACE FUNCTION public.select_initiative_card(
  p_room_id uuid,
  p_session_id text,
  p_card_index integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_number INTEGER;
  v_state RECORD;
  v_hand jsonb;
  v_card jsonb;
  v_board jsonb;
  v_player_key text;
  v_new_version INTEGER;
  v_cmd_state jsonb;
  v_cmd_free INTEGER;
  v_strategy_total INTEGER;
  v_card_cmd_req INTEGER;
  v_card_strat_req INTEGER;
BEGIN
  v_player_number := public.get_player_number_by_session(p_room_id, p_session_id);
  v_player_key := 'p' || v_player_number::text;
  
  SELECT * INTO v_state FROM public.match_state WHERE room_id = p_room_id;
  IF v_state IS NULL THEN RAISE EXCEPTION 'Estado não encontrado'; END IF;
  IF v_state.combat_phase != 'initiative' THEN RAISE EXCEPTION 'Não está na fase de iniciativa'; END IF;
  
  IF v_player_number = 1 THEN
    v_hand := COALESCE(v_state.player1_hand, '[]'::jsonb);
    v_cmd_state := COALESCE(v_state.player1_cmd_state, '{"cmd_free": 0, "strategy_total": 0}'::jsonb);
  ELSE
    v_hand := COALESCE(v_state.player2_hand, '[]'::jsonb);
    v_cmd_state := COALESCE(v_state.player2_cmd_state, '{"cmd_free": 0, "strategy_total": 0}'::jsonb);
  END IF;
  
  v_cmd_free := COALESCE((v_cmd_state->>'cmd_free')::int, 0);
  v_strategy_total := COALESCE((v_cmd_state->>'strategy_total')::int, 0);
  v_board := COALESCE(v_state.combat_board_state, '{}'::jsonb);
  
  IF p_card_index IS NULL THEN
    v_board := jsonb_set(v_board, ARRAY[v_player_key, 'initiative_card'], 'null'::jsonb);
    UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() WHERE room_id = p_room_id RETURNING version INTO v_new_version;
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) VALUES (p_room_id, v_player_number, 'select_initiative_card', jsonb_build_object('no_card', true), 'combat', v_new_version);
    RETURN jsonb_build_object('success', true, 'version', v_new_version);
  END IF;
  
  IF p_card_index < 0 OR p_card_index >= jsonb_array_length(v_hand) THEN RAISE EXCEPTION 'Índice inválido'; END IF;
  
  v_card := v_hand->p_card_index;
  v_card_cmd_req := COALESCE((v_card->>'command_required')::int, 0);
  v_card_strat_req := COALESCE((v_card->>'strategy_required')::int, 0);
  
  IF v_card_cmd_req > v_cmd_free THEN
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) VALUES (p_room_id, v_player_number, 'card_selection_blocked', jsonb_build_object('reason', 'insufficient_cmd', 'required', v_card_cmd_req, 'available', v_cmd_free), 'combat', v_state.version);
    RAISE EXCEPTION 'Comando insuficiente. Requer: %, Disponível: %', v_card_cmd_req, v_cmd_free;
  END IF;
  
  IF v_card_strat_req > v_strategy_total THEN
    INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) VALUES (p_room_id, v_player_number, 'card_selection_blocked', jsonb_build_object('reason', 'insufficient_strategy', 'required', v_card_strat_req, 'available', v_strategy_total), 'combat', v_state.version);
    RAISE EXCEPTION 'Estratégia insuficiente. Requer: %, Disponível: %', v_card_strat_req, v_strategy_total;
  END IF;
  
  v_board := jsonb_set(v_board, ARRAY[v_player_key, 'initiative_card'], v_card);
  UPDATE public.match_state SET combat_board_state = v_board, version = version + 1, updated_at = now() WHERE room_id = p_room_id RETURNING version INTO v_new_version;
  INSERT INTO public.match_actions (room_id, player_number, action_type, action_data, phase, state_version) VALUES (p_room_id, v_player_number, 'select_initiative_card', jsonb_build_object('card_name', v_card->>'name', 'cmd_req', v_card_cmd_req), 'combat', v_new_version);
  
  RETURN jsonb_build_object('success', true, 'version', v_new_version, 'selected_card', v_card);
END;
$$;
