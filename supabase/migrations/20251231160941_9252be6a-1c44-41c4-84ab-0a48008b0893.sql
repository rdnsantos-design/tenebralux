-- Tabela para armazenar exércitos estratégicos salvos
CREATE TABLE public.strategic_armies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  total_vet INTEGER NOT NULL DEFAULT 100,
  attack INTEGER NOT NULL DEFAULT 0,
  defense INTEGER NOT NULL DEFAULT 0,
  mobility INTEGER NOT NULL DEFAULT 0,
  culture_id UUID REFERENCES public.mass_combat_cultures(id),
  regent_id UUID REFERENCES public.regents(id),
  realm_id UUID REFERENCES public.realms(id),
  province_id UUID REFERENCES public.provinces(id),
  commanders JSONB NOT NULL DEFAULT '[]'::jsonb,
  tactical_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para sessões de jogo multiplayer
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, setup, playing, finished
  player1_nickname TEXT,
  player2_nickname TEXT,
  player1_army_id UUID REFERENCES public.strategic_armies(id),
  player2_army_id UUID REFERENCES public.strategic_armies(id),
  current_phase TEXT DEFAULT 'setup', -- setup, attack, defense, initiative, resolution
  current_round INTEGER DEFAULT 1,
  player1_ready BOOLEAN DEFAULT false,
  player2_ready BOOLEAN DEFAULT false,
  game_state JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para cartas jogadas em cada rodada
CREATE TABLE public.game_played_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_number INTEGER NOT NULL CHECK (player_number IN (1, 2)),
  round INTEGER NOT NULL,
  phase TEXT NOT NULL, -- attack, defense, initiative
  card_id UUID NOT NULL REFERENCES public.mass_combat_tactical_cards(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para resultados manuais de cada rodada
CREATE TABLE public.game_round_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  player1_result JSONB DEFAULT '{}'::jsonb,
  player2_result JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategic_armies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_played_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_round_results ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sem autenticação)
CREATE POLICY "Public can view strategic armies" ON public.strategic_armies FOR SELECT USING (true);
CREATE POLICY "Public can insert strategic armies" ON public.strategic_armies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update strategic armies" ON public.strategic_armies FOR UPDATE USING (true);
CREATE POLICY "Public can delete strategic armies" ON public.strategic_armies FOR DELETE USING (true);

CREATE POLICY "Public can view game sessions" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "Public can insert game sessions" ON public.game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update game sessions" ON public.game_sessions FOR UPDATE USING (true);
CREATE POLICY "Public can delete game sessions" ON public.game_sessions FOR DELETE USING (true);

CREATE POLICY "Public can view played cards" ON public.game_played_cards FOR SELECT USING (true);
CREATE POLICY "Public can insert played cards" ON public.game_played_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete played cards" ON public.game_played_cards FOR DELETE USING (true);

CREATE POLICY "Public can view round results" ON public.game_round_results FOR SELECT USING (true);
CREATE POLICY "Public can insert round results" ON public.game_round_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update round results" ON public.game_round_results FOR UPDATE USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_strategic_armies_updated_at
  BEFORE UPDATE ON public.strategic_armies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime para sincronização multiplayer
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_played_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_round_results;