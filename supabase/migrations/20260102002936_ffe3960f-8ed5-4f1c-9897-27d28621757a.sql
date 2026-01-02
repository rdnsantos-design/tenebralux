-- ========================
-- FASE 0: FUNDAÇÃO - MULTIPLAYER CARD GAME
-- ========================

-- Enum para status da sala
CREATE TYPE public.room_status AS ENUM ('waiting', 'ready', 'in_progress', 'finished', 'cancelled');

-- Enum para status do jogador
CREATE TYPE public.player_status AS ENUM ('joined', 'ready', 'disconnected');

-- Enum para fases do jogo
CREATE TYPE public.game_phase AS ENUM (
  'lobby',
  'culture_selection',
  'scenario_selection',
  'scenario_tiebreak',
  'deckbuilding',
  'combat_setup',
  'combat',
  'resolution'
);

-- ========================
-- TABELA: rooms
-- Sala de jogo principal
-- ========================
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_nickname TEXT NOT NULL,
  status room_status NOT NULL DEFAULT 'waiting',
  current_phase game_phase NOT NULL DEFAULT 'lobby',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por código
CREATE INDEX idx_rooms_code ON public.rooms(code);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Policies: qualquer um pode ver e manipular salas (jogo público)
CREATE POLICY "Anyone can view rooms"
  ON public.rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON public.rooms FOR UPDATE
  USING (true);

-- ========================
-- TABELA: room_players
-- Jogadores em cada sala
-- ========================
CREATE TABLE public.room_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_number INTEGER NOT NULL CHECK (player_number IN (1, 2)),
  nickname TEXT NOT NULL,
  session_id TEXT NOT NULL,
  status player_status NOT NULL DEFAULT 'joined',
  is_host BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Cada sala só pode ter 2 jogadores, cada um com número único
  UNIQUE(room_id, player_number)
);

-- Índices
CREATE INDEX idx_room_players_room_id ON public.room_players(room_id);
CREATE INDEX idx_room_players_session_id ON public.room_players(session_id);

-- Enable RLS
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view room players"
  ON public.room_players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join rooms"
  ON public.room_players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can update their own status"
  ON public.room_players FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can leave rooms"
  ON public.room_players FOR DELETE
  USING (true);

-- ========================
-- TABELA: match_state
-- Estado do jogo com versionamento (optimistic locking)
-- ========================
CREATE TABLE public.match_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Seed para randomização server-side
  game_seed TEXT,
  
  -- Seleção de cultura
  player1_culture TEXT,
  player1_culture_confirmed BOOLEAN NOT NULL DEFAULT false,
  player2_culture TEXT,
  player2_culture_confirmed BOOLEAN NOT NULL DEFAULT false,
  
  -- Seleção de cenário (logística)
  scenario_options JSONB, -- [{terrain_id, terrain_name, season_id, season_name, draw_order}]
  player1_logistics_bid INTEGER,
  player1_logistics_confirmed BOOLEAN NOT NULL DEFAULT false,
  player2_logistics_bid INTEGER,
  player2_logistics_confirmed BOOLEAN NOT NULL DEFAULT false,
  
  -- Resultado do cenário
  scenario_winner INTEGER, -- 1 ou 2
  selected_terrain_id UUID,
  selected_season_id UUID,
  
  -- Tiebreak (rodada 2)
  tiebreak_required BOOLEAN NOT NULL DEFAULT false,
  tiebreak_players INTEGER[], -- jogadores que empataram
  player1_tiebreak_bid INTEGER,
  player1_tiebreak_confirmed BOOLEAN NOT NULL DEFAULT false,
  player2_tiebreak_bid INTEGER,
  player2_tiebreak_confirmed BOOLEAN NOT NULL DEFAULT false,
  
  -- VET após cenário
  player1_vet_remaining INTEGER,
  player2_vet_remaining INTEGER,
  
  -- Deckbuilding
  player1_deck JSONB, -- {attributes: {attack, defense, mobility}, commanders: [], general_id, cards: []}
  player1_deck_confirmed BOOLEAN NOT NULL DEFAULT false,
  player2_deck JSONB,
  player2_deck_confirmed BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match state"
  ON public.match_state FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create match state"
  ON public.match_state FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update match state"
  ON public.match_state FOR UPDATE
  USING (true);

-- ========================
-- TABELA: match_actions
-- Log de ações para auditoria
-- ========================
CREATE TABLE public.match_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_number INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB,
  phase game_phase NOT NULL,
  state_version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por sala
CREATE INDEX idx_match_actions_room_id ON public.match_actions(room_id);

-- Enable RLS
ALTER TABLE public.match_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match actions"
  ON public.match_actions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can log actions"
  ON public.match_actions FOR INSERT
  WITH CHECK (true);

-- ========================
-- REALTIME: Habilitar para sincronização
-- ========================
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.match_state REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_state;

-- ========================
-- TRIGGERS: Atualizar updated_at
-- ========================
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_players_updated_at
  BEFORE UPDATE ON public.room_players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_match_state_updated_at
  BEFORE UPDATE ON public.match_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- FUNÇÃO: Gerar código de sala único
-- ========================
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ========================
-- FUNÇÃO: Criar sala com código único
-- ========================
CREATE OR REPLACE FUNCTION public.create_room(p_host_nickname TEXT, p_session_id TEXT)
RETURNS TABLE(room_id UUID, room_code TEXT, player_id UUID)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_room_code TEXT;
  v_player_id UUID;
  v_attempts INTEGER := 0;
BEGIN
  -- Tentar criar código único
  LOOP
    v_room_code := generate_room_code();
    v_attempts := v_attempts + 1;
    
    BEGIN
      INSERT INTO public.rooms (code, host_nickname, status)
      VALUES (v_room_code, p_host_nickname, 'waiting')
      RETURNING id INTO v_room_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts > 10 THEN
        RAISE EXCEPTION 'Não foi possível gerar código único após 10 tentativas';
      END IF;
    END;
  END LOOP;
  
  -- Adicionar host como jogador 1
  INSERT INTO public.room_players (room_id, player_number, nickname, session_id, is_host, status)
  VALUES (v_room_id, 1, p_host_nickname, p_session_id, true, 'joined')
  RETURNING id INTO v_player_id;
  
  -- Criar estado inicial
  INSERT INTO public.match_state (room_id, game_seed)
  VALUES (v_room_id, gen_random_uuid()::text);
  
  RETURN QUERY SELECT v_room_id, v_room_code, v_player_id;
END;
$$;

-- ========================
-- FUNÇÃO: Entrar em sala existente
-- ========================
CREATE OR REPLACE FUNCTION public.join_room(p_room_code TEXT, p_nickname TEXT, p_session_id TEXT)
RETURNS TABLE(room_id UUID, player_id UUID, player_number INTEGER)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_player_id UUID;
  v_player_count INTEGER;
  v_room_status room_status;
BEGIN
  -- Buscar sala
  SELECT id, status INTO v_room_id, v_room_status
  FROM public.rooms
  WHERE code = UPPER(p_room_code);
  
  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Sala não encontrada';
  END IF;
  
  IF v_room_status != 'waiting' THEN
    RAISE EXCEPTION 'Sala não está aceitando jogadores';
  END IF;
  
  -- Contar jogadores
  SELECT COUNT(*) INTO v_player_count
  FROM public.room_players
  WHERE room_players.room_id = v_room_id;
  
  IF v_player_count >= 2 THEN
    RAISE EXCEPTION 'Sala está cheia';
  END IF;
  
  -- Adicionar como jogador 2
  INSERT INTO public.room_players (room_id, player_number, nickname, session_id, is_host, status)
  VALUES (v_room_id, 2, p_nickname, p_session_id, false, 'joined')
  RETURNING id INTO v_player_id;
  
  -- Atualizar status da sala para ready
  UPDATE public.rooms
  SET status = 'ready'
  WHERE id = v_room_id;
  
  RETURN QUERY SELECT v_room_id, v_player_id, 2;
END;
$$;

-- ========================
-- FUNÇÃO: Atualizar status do jogador (ready/joined)
-- ========================
CREATE OR REPLACE FUNCTION public.set_player_ready(p_player_id UUID, p_ready BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_all_ready BOOLEAN;
BEGIN
  -- Atualizar status
  UPDATE public.room_players
  SET status = CASE WHEN p_ready THEN 'ready'::player_status ELSE 'joined'::player_status END
  WHERE id = p_player_id
  RETURNING room_id INTO v_room_id;
  
  IF v_room_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se todos estão prontos
  SELECT bool_and(status = 'ready') INTO v_all_ready
  FROM public.room_players
  WHERE room_id = v_room_id;
  
  -- Se todos prontos e sala tem 2 jogadores, iniciar jogo
  IF v_all_ready THEN
    UPDATE public.rooms
    SET status = 'in_progress', current_phase = 'culture_selection'
    WHERE id = v_room_id
    AND (SELECT COUNT(*) FROM public.room_players WHERE room_players.room_id = v_room_id) = 2;
  END IF;
  
  RETURN true;
END;
$$;