
-- Create mass combat primary terrains table
CREATE TABLE public.mass_combat_primary_terrains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_climate TEXT NOT NULL DEFAULT 'Céu aberto',
  allowed_climates TEXT[] NOT NULL DEFAULT '{}',
  attack_mod INTEGER NOT NULL DEFAULT 0,
  defense_mod INTEGER NOT NULL DEFAULT 0,
  mobility_mod INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'normal',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mass combat secondary terrains table
CREATE TABLE public.mass_combat_secondary_terrains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  effect_description TEXT,
  attack_mod INTEGER NOT NULL DEFAULT 0,
  defense_mod INTEGER NOT NULL DEFAULT 0,
  mobility_mod INTEGER NOT NULL DEFAULT 0,
  strategy_mod INTEGER NOT NULL DEFAULT 0,
  special_effects TEXT,
  is_universal BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for primary-secondary terrain compatibility
CREATE TABLE public.mass_combat_terrain_compatibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_terrain_id UUID NOT NULL REFERENCES public.mass_combat_primary_terrains(id) ON DELETE CASCADE,
  secondary_terrain_id UUID NOT NULL REFERENCES public.mass_combat_secondary_terrains(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(primary_terrain_id, secondary_terrain_id)
);

-- Enable RLS
ALTER TABLE public.mass_combat_primary_terrains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mass_combat_secondary_terrains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mass_combat_terrain_compatibility ENABLE ROW LEVEL SECURITY;

-- RLS Policies for primary terrains
CREATE POLICY "Anyone can view primary terrains" ON public.mass_combat_primary_terrains FOR SELECT USING (true);
CREATE POLICY "Anyone can insert primary terrains" ON public.mass_combat_primary_terrains FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update primary terrains" ON public.mass_combat_primary_terrains FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete primary terrains" ON public.mass_combat_primary_terrains FOR DELETE USING (true);

-- RLS Policies for secondary terrains
CREATE POLICY "Anyone can view secondary terrains" ON public.mass_combat_secondary_terrains FOR SELECT USING (true);
CREATE POLICY "Anyone can insert secondary terrains" ON public.mass_combat_secondary_terrains FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update secondary terrains" ON public.mass_combat_secondary_terrains FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete secondary terrains" ON public.mass_combat_secondary_terrains FOR DELETE USING (true);

-- RLS Policies for compatibility
CREATE POLICY "Anyone can view terrain compatibility" ON public.mass_combat_terrain_compatibility FOR SELECT USING (true);
CREATE POLICY "Anyone can insert terrain compatibility" ON public.mass_combat_terrain_compatibility FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete terrain compatibility" ON public.mass_combat_terrain_compatibility FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_mass_combat_primary_terrains_updated_at
  BEFORE UPDATE ON public.mass_combat_primary_terrains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mass_combat_secondary_terrains_updated_at
  BEFORE UPDATE ON public.mass_combat_secondary_terrains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
