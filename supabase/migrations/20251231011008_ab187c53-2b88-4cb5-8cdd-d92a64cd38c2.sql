-- Add new columns for penalties, effects, conditions and VET override
ALTER TABLE public.mass_combat_tactical_cards
ADD COLUMN IF NOT EXISTS attack_penalty integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS defense_penalty integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS mobility_penalty integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS minor_effect text,
ADD COLUMN IF NOT EXISTS major_effect text,
ADD COLUMN IF NOT EXISTS minor_condition text,
ADD COLUMN IF NOT EXISTS major_condition text,
ADD COLUMN IF NOT EXISTS vet_cost_override integer;