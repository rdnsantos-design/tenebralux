-- Expandir tabela regents com campos de Army.Regent
-- Adicionando campos para gestão de exércitos e recursos

-- Adicionar campo para identificar o jogador/personagem
ALTER TABLE public.regents 
ADD COLUMN IF NOT EXISTS character TEXT;

-- Adicionar campo para domínio
ALTER TABLE public.regents 
ADD COLUMN IF NOT EXISTS domain TEXT;

-- Adicionar recursos econômicos
ALTER TABLE public.regents 
ADD COLUMN IF NOT EXISTS gold_bars INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.regents 
ADD COLUMN IF NOT EXISTS regency_points INTEGER NOT NULL DEFAULT 0;

-- Adicionar perícias de comando e estratégia (1-5)
ALTER TABLE public.regents 
ADD COLUMN IF NOT EXISTS comando INTEGER NOT NULL DEFAULT 1 CHECK (comando >= 1 AND comando <= 5);

ALTER TABLE public.regents 
ADD COLUMN IF NOT EXISTS estrategia INTEGER NOT NULL DEFAULT 1 CHECK (estrategia >= 1 AND estrategia <= 5);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.regents.character IS 'Nome do jogador que controla o regente';
COMMENT ON COLUMN public.regents.domain IS 'Domínio do regente';
COMMENT ON COLUMN public.regents.gold_bars IS 'Recursos em Gold Bars (GB)';
COMMENT ON COLUMN public.regents.regency_points IS 'Pontos de Regência (RP)';
COMMENT ON COLUMN public.regents.comando IS 'Perícia de comando (1-5)';
COMMENT ON COLUMN public.regents.estrategia IS 'Perícia de estratégia (1-5)';