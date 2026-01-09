-- Tabela principal de planetas da galáxia
CREATE TABLE public.galaxy_planets (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  z NUMERIC NOT NULL DEFAULT 0,
  distancia NUMERIC NOT NULL DEFAULT 0,
  regiao TEXT NOT NULL,
  faccao TEXT NOT NULL,
  zona TEXT NOT NULL DEFAULT 'Core',
  tier INTEGER NOT NULL DEFAULT 1 CHECK (tier >= 1 AND tier <= 5),
  d INTEGER NOT NULL DEFAULT 1 CHECK (d >= 1 AND d <= 10),
  r INTEGER NOT NULL DEFAULT 1 CHECK (r >= 1 AND r <= 10),
  def INTEGER NOT NULL DEFAULT 0 CHECK (def >= 0 AND def <= 6),
  slots_prod INTEGER NOT NULL DEFAULT 1 CHECK (slots_prod >= 1 AND slots_prod <= 10),
  slots_com INTEGER NOT NULL DEFAULT 1 CHECK (slots_com >= 1 AND slots_com <= 10),
  slots_soc INTEGER NOT NULL DEFAULT 1 CHECK (slots_soc >= 1 AND slots_soc <= 10),
  pcp_total INTEGER NOT NULL DEFAULT 0,
  pcp_gasto INTEGER NOT NULL DEFAULT 0,
  tags_positivas TEXT DEFAULT '',
  tags_negativas TEXT DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'Terrestre',
  funcao TEXT NOT NULL DEFAULT 'Colonial',
  populacao BIGINT NOT NULL DEFAULT 0,
  descricao TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_galaxy_planets_faccao ON public.galaxy_planets(faccao);
CREATE INDEX idx_galaxy_planets_regiao ON public.galaxy_planets(regiao);
CREATE INDEX idx_galaxy_planets_tier ON public.galaxy_planets(tier);
CREATE INDEX idx_galaxy_planets_coords ON public.galaxy_planets(x, y, z);

-- Enable RLS
ALTER TABLE public.galaxy_planets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso público para leitura, autenticados para escrita)
CREATE POLICY "Anyone can view planets" ON public.galaxy_planets
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert planets" ON public.galaxy_planets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update planets" ON public.galaxy_planets
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete planets" ON public.galaxy_planets
  FOR DELETE USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_galaxy_planets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_galaxy_planets_timestamp
  BEFORE UPDATE ON public.galaxy_planets
  FOR EACH ROW
  EXECUTE FUNCTION update_galaxy_planets_updated_at();

-- Tabela de facções (para referência e cores)
CREATE TABLE public.galaxy_factions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7f8c8d',
  planets_count INTEGER NOT NULL DEFAULT 0,
  percent NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.galaxy_factions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view factions" ON public.galaxy_factions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage factions" ON public.galaxy_factions
  FOR ALL USING (true);

-- Inserir facções com cores
INSERT INTO public.galaxy_factions (id, name, color, planets_count, percent) VALUES
  ('alianca', 'Aliança Estelar', '#3498db', 105, 33.7),
  ('hegemonia', 'Hegemonia Humanista', '#e74c3c', 63, 20.2),
  ('pacto', 'Pacto de Liberstadt', '#2ecc71', 39, 12.5),
  ('federacao', 'Federação Solônica', '#f39c12', 36, 11.5),
  ('concordia', 'Nova Concórdia', '#95a5a6', 30, 9.6),
  ('independente', 'Independente', '#7f8c8d', 21, 6.7),
  ('synaxis', 'Synaxis', '#1abc9c', 7, 2.2),
  ('brunianos', 'República Bruniana', '#9b59b6', 6, 1.9),
  ('fantasma', 'Zona Fantasma', '#2c3e50', 3, 1.0),
  ('disputada', 'Zona Disputada', '#e67e22', 2, 0.6);