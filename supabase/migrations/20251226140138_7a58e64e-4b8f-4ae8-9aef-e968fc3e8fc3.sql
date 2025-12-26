-- Create function to update timestamps if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for character abilities library
CREATE TABLE public.character_abilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ability_type TEXT NOT NULL DEFAULT 'Passiva',
  effect_type TEXT NOT NULL DEFAULT 'buff_self',
  affected_attribute TEXT,
  attribute_modifier INTEGER DEFAULT 0,
  conditional_type TEXT DEFAULT 'none',
  conditional_description TEXT,
  range_type TEXT DEFAULT 'self',
  base_power_cost NUMERIC(4,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for character cards
CREATE TABLE public.character_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  character_type TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  culture TEXT NOT NULL,
  comando INTEGER NOT NULL DEFAULT 1,
  estrategia INTEGER NOT NULL DEFAULT 1,
  guarda INTEGER NOT NULL DEFAULT 2,
  passive_bonus_type TEXT,
  passive_bonus_value INTEGER DEFAULT 0,
  passive_affects_area BOOLEAN DEFAULT false,
  specialties TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  ability_id UUID REFERENCES public.character_abilities(id),
  custom_ability_name TEXT,
  custom_ability_description TEXT,
  custom_ability_power_cost NUMERIC(4,1) DEFAULT 0,
  total_power_cost NUMERIC(4,1) NOT NULL DEFAULT 0,
  power_cost_override NUMERIC(4,1),
  portrait_url TEXT,
  coat_of_arms_url TEXT,
  domain TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for system configuration
CREATE TABLE public.character_system_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default configuration
INSERT INTO public.character_system_config (config_key, config_value) VALUES
('attribute_costs', '{"comando": 1, "estrategia": 2, "guarda": 0.5}'::jsonb),
('passive_bonus_costs', '{"1": 1, "2": 3, "3": 5}'::jsonb),
('passive_area_cost', '1'::jsonb),
('conditional_discounts', '{"none": 0, "light": 1, "heavy": 2}'::jsonb),
('cultures', '["Anuire", "Khinasi", "Vos", "Rjurik", "Brecht"]'::jsonb),
('specialties', '["Infantaria", "Cavalaria", "Arqueria", "Sitio"]'::jsonb);

-- Enable RLS
ALTER TABLE public.character_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_system_config ENABLE ROW LEVEL SECURITY;

-- Create policies for character_abilities
CREATE POLICY "Anyone can view abilities" ON public.character_abilities FOR SELECT USING (true);
CREATE POLICY "Anyone can insert abilities" ON public.character_abilities FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update abilities" ON public.character_abilities FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete abilities" ON public.character_abilities FOR DELETE USING (true);

-- Create policies for character_cards
CREATE POLICY "Anyone can view character cards" ON public.character_cards FOR SELECT USING (true);
CREATE POLICY "Anyone can insert character cards" ON public.character_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update character cards" ON public.character_cards FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete character cards" ON public.character_cards FOR DELETE USING (true);

-- Create policies for character_system_config
CREATE POLICY "Anyone can view config" ON public.character_system_config FOR SELECT USING (true);
CREATE POLICY "Anyone can update config" ON public.character_system_config FOR UPDATE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_character_abilities_updated_at
BEFORE UPDATE ON public.character_abilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_character_cards_updated_at
BEFORE UPDATE ON public.character_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_character_system_config_updated_at
BEFORE UPDATE ON public.character_system_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();