-- Create terrain_types table
CREATE TABLE public.terrain_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tag TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  movement_mod TEXT NOT NULL DEFAULT '0',
  defense_mod INTEGER NOT NULL DEFAULT 0,
  morale_mod INTEGER NOT NULL DEFAULT 0,
  ranged_mod INTEGER NOT NULL DEFAULT 0,
  special TEXT,
  mod_rjurik TEXT,
  mod_vos TEXT,
  mod_khinasi TEXT,
  mod_brecht TEXT,
  mod_anuire TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.terrain_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view terrain types" ON public.terrain_types FOR SELECT USING (true);
CREATE POLICY "Anyone can insert terrain types" ON public.terrain_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update terrain types" ON public.terrain_types FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete terrain types" ON public.terrain_types FOR DELETE USING (true);

-- Insert all terrain data from the Excel
INSERT INTO public.terrain_types (name, tag, level, movement_mod, defense_mod, morale_mod, ranged_mod, special, mod_rjurik, mod_vos, mod_khinasi, mod_brecht, mod_anuire) VALUES
('Planície', NULL, 0, '0', 0, 0, 0, 'Terreno neutro', NULL, NULL, NULL, NULL, '+1 Defesa'),
('Colina', 'Elevação', 1, '-1', 1, 0, 1, '+1 ataque contra inimigos abaixo', NULL, NULL, NULL, NULL, NULL),
('Morro', 'Elevação', 2, '-2', 2, 0, 2, '+2 ataque contra inimigos abaixo', NULL, NULL, NULL, NULL, NULL),
('Montanha', 'Elevação', 3, '-3', 3, 1, 2, 'Apenas infantaria. Cavalaria não entra', '-1 mov', '-1 mov', '-1 mov', '-1 mov', '-1 mov'),
('Córrego', 'Profundidade', 1, '-1', 0, -1, 0, 'Travessia lenta, -1 Moral', NULL, NULL, NULL, '+1 Defesa', NULL),
('Rio', 'Profundidade', 2, 'Intransp.', 0, 0, 0, 'Apenas atravessável por ponte ou unidade especializada', NULL, NULL, NULL, NULL, NULL),
('Deserto', 'Obstrução', 1, '-1', -1, -1, 0, 'Calor. Unidades sofrem penalidades prolongadas', '+1 penalidade', NULL, 'Ignora penalidade', '+1 penalidade', NULL),
('Dunas', 'Obstrução', 2, '-2', -1, -1, -1, 'Calor + Dificuldade de tiro', '+1 penalidade', NULL, 'Ignora penalidade', '+1 penalidade', NULL),
('Neve', 'Obstrução', 1, '-1', 0, -1, 0, 'Frio. Penalidade prolongada', 'Ignora penalidade', 'Ignora penalidade', '+1 penalidade', '+1 penalidade', NULL),
('Gelo', 'Obstrução', 2, '-2', -1, -2, -1, 'Frio + terreno escorregadio. Cavalaria tem -2 mov.', 'Ignora penalidade', 'Ignora penalidade', '+1 penalidade', '+1 penalidade', NULL),
('Brejo', 'Obstrução', 1, '-1', 1, -1, 0, NULL, NULL, NULL, NULL, '+1 Defesa', NULL),
('Pântano', 'Obstrução', 2, '-2', 1, -2, -1, 'Cavalaria não entra', NULL, NULL, NULL, '+1 Defesa', NULL),
('Paliçada', 'Fortificação', 1, '0', 1, 1, 0, 'Estrutura leve de defesa', NULL, NULL, NULL, NULL, '+1 Defesa fort.'),
('Forte', 'Fortificação', 2, '0', 2, 1, 0, 'Proteção considerável', NULL, NULL, NULL, NULL, '+1 Defesa fort.'),
('Castelo', 'Fortificação', 3, '0', 3, 1, 0, 'Unidades dentro são imunes a moral', NULL, NULL, NULL, NULL, '+1 Defesa fort.'),
('Fortaleza', 'Fortificação', 4, '0', 4, 2, 0, 'Imune a moral e debuffs', NULL, NULL, NULL, NULL, '+1 Defesa fort.'),
('Matagal', 'Cobertura', 1, '-1', 1, 0, -1, 'Penaliza tiro', 'Reduz penalidade', NULL, NULL, '+1 Defesa', NULL),
('Bosque', 'Cobertura', 2, '-2', 1, 1, -2, 'Penaliza ainda mais tiro', 'Reduz penalidade', NULL, NULL, '+1 Defesa', NULL),
('Floresta', 'Cobertura', 3, '-3', 2, 1, -2, 'Inimigos têm -1 moral ao entrar nela', 'Reduz penalidade', NULL, NULL, '+1 Defesa', NULL),
('Poça', 'Profundidade', 1, '-1', 0, 0, 0, 'Superficial', NULL, NULL, NULL, '+1 Defesa', NULL),
('Lago', 'Profundidade', 2, 'Intransp.', 0, 0, 0, 'Travessia apenas com barcos', NULL, NULL, NULL, NULL, NULL),
('Rochas', 'Obstáculo', 1, '-1', 1, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL),
('Ruínas', 'Obstáculo', 1, '-1', 1, 0, 0, 'Ideal para emboscadas', NULL, NULL, NULL, '+1 Defesa', NULL),
('Depressão', 'Desnível', 1, '-1', -1, -1, 0, '-1 moral ao ser atacado de cima', NULL, NULL, NULL, NULL, NULL),
('Ravina', 'Desnível', 2, '-2', -1, -2, -1, '-2 moral ao ser atacado de cima. Difícil acesso', NULL, NULL, NULL, NULL, NULL),
('Fosso', 'Desnível', 3, 'Intransp.', 0, 0, 0, 'Intransponível sem ponte ou equipamento', NULL, NULL, NULL, NULL, NULL);