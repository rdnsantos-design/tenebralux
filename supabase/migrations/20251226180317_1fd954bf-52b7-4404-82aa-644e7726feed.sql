-- Create table for mass combat tactical cards (different from maneuver cards)
CREATE TABLE public.mass_combat_tactical_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit_type TEXT NOT NULL, -- Infantaria, Cavalaria, Arqueiros, Cerco, Geral
  attack_bonus INTEGER NOT NULL DEFAULT 0 CHECK (attack_bonus >= 0 AND attack_bonus <= 3),
  defense_bonus INTEGER NOT NULL DEFAULT 0 CHECK (defense_bonus >= 0 AND defense_bonus <= 3),
  mobility_bonus INTEGER NOT NULL DEFAULT 0 CHECK (mobility_bonus >= 0 AND mobility_bonus <= 3),
  command_required INTEGER NOT NULL DEFAULT 1 CHECK (command_required >= 1 AND command_required <= 5),
  strategy_required INTEGER NOT NULL DEFAULT 1 CHECK (strategy_required >= 1 AND strategy_required <= 5),
  culture TEXT, -- Optional culture restriction
  description TEXT, -- Optional narrative description
  vet_cost INTEGER NOT NULL DEFAULT 0, -- Calculated: sum of all bonuses
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mass_combat_tactical_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Anyone can view mass combat tactical cards" 
ON public.mass_combat_tactical_cards 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert mass combat tactical cards" 
ON public.mass_combat_tactical_cards 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update mass combat tactical cards" 
ON public.mass_combat_tactical_cards 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete mass combat tactical cards" 
ON public.mass_combat_tactical_cards 
FOR DELETE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_mass_combat_tactical_cards_updated_at
BEFORE UPDATE ON public.mass_combat_tactical_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();