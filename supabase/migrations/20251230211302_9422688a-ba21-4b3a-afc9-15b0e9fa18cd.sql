-- Add new columns for effect_tag and style
ALTER TABLE public.mass_combat_secondary_terrains 
ADD COLUMN IF NOT EXISTS effect_tag TEXT,
ADD COLUMN IF NOT EXISTS style TEXT DEFAULT 'Versátil';