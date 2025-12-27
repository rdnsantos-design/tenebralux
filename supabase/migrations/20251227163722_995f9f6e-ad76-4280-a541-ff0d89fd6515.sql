-- Add game_mode column to mass_combat_tactical_cards
ALTER TABLE public.mass_combat_tactical_cards 
ADD COLUMN game_mode text NOT NULL DEFAULT 'estrategico' 
CHECK (game_mode IN ('tatico', 'estrategico', 'ambos'));

-- Add game_mode column to tactical_cards
ALTER TABLE public.tactical_cards 
ADD COLUMN game_mode text NOT NULL DEFAULT 'tatico' 
CHECK (game_mode IN ('tatico', 'estrategico', 'ambos'));

-- Add game_mode column to character_cards  
ALTER TABLE public.character_cards 
ADD COLUMN game_mode text NOT NULL DEFAULT 'ambos' 
CHECK (game_mode IN ('tatico', 'estrategico', 'ambos'));

-- Add comment explaining the values
COMMENT ON COLUMN public.mass_combat_tactical_cards.game_mode IS 'tatico = board game, estrategico = card game, ambos = both';
COMMENT ON COLUMN public.tactical_cards.game_mode IS 'tatico = board game, estrategico = card game, ambos = both';
COMMENT ON COLUMN public.character_cards.game_mode IS 'tatico = board game, estrategico = card game, ambos = both';