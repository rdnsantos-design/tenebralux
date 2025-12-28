-- Add new columns for PC/NPC distinction and regent linking
ALTER TABLE public.character_cards
ADD COLUMN is_pc boolean NOT NULL DEFAULT false,
ADD COLUMN player_name text,
ADD COLUMN regent_id uuid REFERENCES public.regents(id) ON DELETE SET NULL;