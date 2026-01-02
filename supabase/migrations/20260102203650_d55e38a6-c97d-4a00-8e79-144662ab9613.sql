-- Adicionar campo card_type para classificar as cartas por fase permitida
-- ofensiva = fase de ataque
-- defensiva = fase de defesa
-- movimentacao = fase de iniciativa
-- reacao = subfases de reação

ALTER TABLE public.mass_combat_tactical_cards 
ADD COLUMN IF NOT EXISTS card_type TEXT NOT NULL DEFAULT 'ofensiva';

-- Adicionar constraint para valores válidos
ALTER TABLE public.mass_combat_tactical_cards
ADD CONSTRAINT chk_card_type CHECK (card_type IN ('ofensiva', 'defensiva', 'movimentacao', 'reacao'));

-- Atualizar cartas existentes baseado no effect_tag atual
UPDATE public.mass_combat_tactical_cards 
SET card_type = 'movimentacao' 
WHERE effect_tag = 'movimentacao';

UPDATE public.mass_combat_tactical_cards 
SET card_type = 'reacao' 
WHERE effect_tag = 'reacao';

-- Cartas sem effect_tag que têm apenas defense_bonus são defensivas
UPDATE public.mass_combat_tactical_cards 
SET card_type = 'defensiva' 
WHERE card_type = 'ofensiva' 
  AND attack_bonus = 0 
  AND defense_bonus > 0 
  AND effect_tag IS NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.mass_combat_tactical_cards.card_type IS 
  'Tipo da carta que define em qual fase pode ser jogada: ofensiva (ataque), defensiva (defesa), movimentacao (iniciativa), reacao (subfases de reação)';