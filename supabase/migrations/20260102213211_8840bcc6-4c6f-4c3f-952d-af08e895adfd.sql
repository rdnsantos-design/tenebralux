-- Tabelas para o Sistema de Batalha Tática
-- NÃO afeta tabelas existentes (unit_instances, strategic_armies, field_commanders, etc.)

CREATE TABLE IF NOT EXISTS tactical_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  join_code TEXT UNIQUE NOT NULL,
  
  player1_id TEXT NOT NULL,
  player1_name TEXT NOT NULL,
  player1_army_id UUID,
  player1_ready BOOLEAN DEFAULT FALSE,
  
  player2_id TEXT,
  player2_name TEXT,
  player2_army_id UUID,
  player2_ready BOOLEAN DEFAULT FALSE,
  
  primary_terrain_id UUID REFERENCES mass_combat_primary_terrains(id),
  secondary_terrain_ids UUID[] DEFAULT '{}',
  season_id UUID REFERENCES mass_combat_seasons(id),
  max_power_points INTEGER DEFAULT 200,
  
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'playing', 'finished', 'abandoned')),
  winner_id TEXT,
  
  turn_time_limit INTEGER,
  allow_spectators BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tactical_game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES tactical_matches(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  state JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  last_action_type TEXT,
  last_action_by TEXT,
  last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tactical_game_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES tactical_matches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  player_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  sequence_number SERIAL,
  resulting_state_hash TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tactical_matches_status ON tactical_matches(status);
CREATE INDEX IF NOT EXISTS idx_tactical_matches_join_code ON tactical_matches(join_code);
CREATE INDEX IF NOT EXISTS idx_tactical_matches_player1 ON tactical_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_tactical_matches_player2 ON tactical_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_tactical_game_states_match ON tactical_game_states(match_id);
CREATE INDEX IF NOT EXISTS idx_tactical_game_actions_match ON tactical_game_actions(match_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tactical_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE tactical_game_states;

-- RLS
ALTER TABLE tactical_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_game_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for tactical_matches" ON tactical_matches FOR ALL USING (true);
CREATE POLICY "Allow all for tactical_game_states" ON tactical_game_states FOR ALL USING (true);
CREATE POLICY "Allow all for tactical_game_actions" ON tactical_game_actions FOR ALL USING (true);

-- Função para gerar código de partida tática
CREATE OR REPLACE FUNCTION generate_tactical_join_code()
RETURNS TEXT 
LANGUAGE plpgsql
SET search_path TO 'public'
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

-- Trigger para auto-gerar código
CREATE OR REPLACE FUNCTION set_tactical_join_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.join_code IS NULL OR NEW.join_code = '' THEN
    NEW.join_code := generate_tactical_join_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_tactical_join_code ON tactical_matches;
CREATE TRIGGER trigger_set_tactical_join_code
  BEFORE INSERT ON tactical_matches
  FOR EACH ROW
  EXECUTE FUNCTION set_tactical_join_code();

-- Trigger para updated_at
CREATE TRIGGER update_tactical_matches_updated_at
  BEFORE UPDATE ON tactical_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tactical_game_states_updated_at
  BEFORE UPDATE ON tactical_game_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();