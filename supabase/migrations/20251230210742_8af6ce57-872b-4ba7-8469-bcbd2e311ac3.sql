-- Create cultures table for mass combat
CREATE TABLE public.mass_combat_cultures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  terrain_affinity TEXT NOT NULL,
  season_affinity TEXT NOT NULL,
  specialization TEXT NOT NULL,
  special_ability TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mass_combat_cultures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view cultures" ON public.mass_combat_cultures FOR SELECT USING (true);
CREATE POLICY "Anyone can insert cultures" ON public.mass_combat_cultures FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update cultures" ON public.mass_combat_cultures FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete cultures" ON public.mass_combat_cultures FOR DELETE USING (true);

-- Insert initial data
INSERT INTO public.mass_combat_cultures (name, terrain_affinity, season_affinity, specialization, special_ability) VALUES
('Anuire', 'Planície', 'Primavera', 'Cavalaria', 'Tap: 1 vez por rodada você pode ignorar os requisitos de comando de uma carta'),
('Khinasi', 'Desértico', 'Verão', 'Cavalaria', 'Tap: Um comandante pode usar duas cartas em sequência (se tiver Comando suficiente).'),
('Vos', 'Ártico', 'Inverno', 'Infantaria', 'Tap: Quando usar um comandante para bônus de ataque, some 2 ao bônus que ele confere.'),
('Brecht', 'Alagado', 'Outono', 'Arqueria', 'Tap: Uma vez por rodada, você pode ignorar os requisitos de especialização de uma carta'),
('Rjurik', 'Floresta', 'Inverno', 'Infantaria', 'Tap: Uma vez por rodada você pode dar untap em um comandante que já tenha sido usado em uma fase anterior (Iniciativa, ataque ou defesa)');