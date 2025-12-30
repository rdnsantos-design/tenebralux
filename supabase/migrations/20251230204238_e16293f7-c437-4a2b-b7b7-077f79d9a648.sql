-- Drop old tables that won't be used anymore
DROP TABLE IF EXISTS mass_combat_climates CASCADE;
DROP TABLE IF EXISTS mass_combat_seasons CASCADE;

-- Create simplified seasons table with embedded conditions
CREATE TABLE public.mass_combat_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  modifier_type TEXT NOT NULL, -- 'ataque', 'defesa', 'mobilidade', 'pv'
  condition1_name TEXT NOT NULL,
  condition1_modifier INTEGER NOT NULL DEFAULT -1,
  condition2_name TEXT NOT NULL,
  condition2_modifier INTEGER NOT NULL DEFAULT -2,
  condition3_name TEXT NOT NULL,
  condition3_modifier INTEGER NOT NULL DEFAULT -3,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mass_combat_seasons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view seasons" ON public.mass_combat_seasons FOR SELECT USING (true);
CREATE POLICY "Anyone can insert seasons" ON public.mass_combat_seasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update seasons" ON public.mass_combat_seasons FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete seasons" ON public.mass_combat_seasons FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_mass_combat_seasons_updated_at
  BEFORE UPDATE ON public.mass_combat_seasons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 4 seasons with their conditions
INSERT INTO public.mass_combat_seasons (name, modifier_type, condition1_name, condition1_modifier, condition2_name, condition2_modifier, condition3_name, condition3_modifier)
VALUES 
  ('Primavera', 'ataque', 'Brisa', -1, 'Vento', -2, 'Vendaval', -3),
  ('Verão', 'defesa', 'Abafado', -1, 'Quente', -2, 'Infernal', -3),
  ('Outono', 'mobilidade', 'Garoa', -1, 'Chuva', -2, 'Tempestade', -3),
  ('Inverno', 'pv', 'Geada', -1, 'Neve', -2, 'Congelante', -3);