-- Add new columns for situational cards (culture, terrain, climate effects)
ALTER TABLE public.mass_combat_tactical_cards 
ADD COLUMN effect_type TEXT,
ADD COLUMN effect_tag TEXT;