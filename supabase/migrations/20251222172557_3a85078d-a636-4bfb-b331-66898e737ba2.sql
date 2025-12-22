-- Enum para tipos de carta
CREATE TYPE public.tactical_card_type AS ENUM ('Ataque', 'Defesa', 'Movimento', 'Moral');

-- Enum para subtipos
CREATE TYPE public.tactical_card_subtype AS ENUM ('Buff', 'Debuff', 'Neutra', 'Instantânea');

-- Enum para culturas
CREATE TYPE public.tactical_culture AS ENUM ('Anuire', 'Khinasi', 'Vos', 'Rjurik', 'Brecht');

-- Tabela principal de cartas táticas
CREATE TABLE public.tactical_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  card_type tactical_card_type NOT NULL,
  subtype tactical_card_subtype NOT NULL,
  
  -- Tipos de unidade afetada (array para múltiplos tipos)
  affected_unit_types TEXT[] NOT NULL DEFAULT '{}',
  
  -- Bônus numéricos (0 ou 1)
  attack_bonus INTEGER NOT NULL DEFAULT 0 CHECK (attack_bonus >= 0 AND attack_bonus <= 1),
  defense_bonus INTEGER NOT NULL DEFAULT 0 CHECK (defense_bonus >= 0 AND defense_bonus <= 1),
  ranged_bonus INTEGER NOT NULL DEFAULT 0 CHECK (ranged_bonus >= 0 AND ranged_bonus <= 1),
  morale_bonus INTEGER NOT NULL DEFAULT 0 CHECK (morale_bonus >= 0 AND morale_bonus <= 1),
  
  -- Danos extras
  extra_pressure_damage INTEGER NOT NULL DEFAULT 0 CHECK (extra_pressure_damage >= 0 AND extra_pressure_damage <= 1),
  extra_lethal_damage INTEGER NOT NULL DEFAULT 0 CHECK (extra_lethal_damage >= 0 AND extra_lethal_damage <= 1),
  
  -- Flags booleanas
  ignores_pressure BOOLEAN NOT NULL DEFAULT false,
  targets_outside_commander_unit BOOLEAN NOT NULL DEFAULT false,
  affects_enemy_unit BOOLEAN NOT NULL DEFAULT false,
  requires_specialization BOOLEAN NOT NULL DEFAULT false,
  
  -- Comando exigido
  required_command INTEGER NOT NULL DEFAULT 0,
  
  -- Culturas com bônus/penalidade (arrays para múltiplas culturas)
  bonus_cultures TEXT[] NOT NULL DEFAULT '{}',
  penalty_cultures TEXT[] NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (público para leitura, mas podemos restringir depois)
ALTER TABLE public.tactical_cards ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (qualquer um pode ver as cartas)
CREATE POLICY "Anyone can view tactical cards"
ON public.tactical_cards
FOR SELECT
USING (true);

-- Política para inserção pública (por enquanto sem auth)
CREATE POLICY "Anyone can insert tactical cards"
ON public.tactical_cards
FOR INSERT
WITH CHECK (true);

-- Política para atualização pública
CREATE POLICY "Anyone can update tactical cards"
ON public.tactical_cards
FOR UPDATE
USING (true);

-- Política para deleção pública
CREATE POLICY "Anyone can delete tactical cards"
ON public.tactical_cards
FOR DELETE
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_tactical_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tactical_cards_updated_at
BEFORE UPDATE ON public.tactical_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_tactical_cards_updated_at();