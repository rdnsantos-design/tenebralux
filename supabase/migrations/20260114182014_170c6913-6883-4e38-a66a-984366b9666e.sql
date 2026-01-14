-- Create weapons table
CREATE TABLE public.rpg_weapons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  weapon_type TEXT NOT NULL CHECK (weapon_type IN ('tiro', 'lamina', 'luta')),
  category TEXT NOT NULL CHECK (category IN ('leve', 'media', 'pesada')),
  damage INTEGER NOT NULL CHECK (damage >= 1 AND damage <= 10),
  damage_type TEXT NOT NULL CHECK (damage_type IN ('balistico', 'energia', 'explosivo', 'laminas', 'contundente')),
  range_base INTEGER DEFAULT 15,
  range_max INTEGER DEFAULT 30,
  range_penalty INTEGER DEFAULT -2,
  speed_mod INTEGER NOT NULL DEFAULT 0,
  movement_mod INTEGER NOT NULL DEFAULT 0,
  damage_ratio TEXT NOT NULL DEFAULT '1:1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create armors table
CREATE TABLE public.rpg_armors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('leve', 'media', 'pesada')),
  resistance INTEGER NOT NULL CHECK (resistance >= 1 AND resistance <= 10),
  movement_mod INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.rpg_weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_armors ENABLE ROW LEVEL SECURITY;

-- Create policies for weapons (public read, authenticated write)
CREATE POLICY "Anyone can view weapons" 
ON public.rpg_weapons 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create weapons" 
ON public.rpg_weapons 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own weapons" 
ON public.rpg_weapons 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own weapons" 
ON public.rpg_weapons 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policies for armors (public read, authenticated write)
CREATE POLICY "Anyone can view armors" 
ON public.rpg_armors 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create armors" 
ON public.rpg_armors 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own armors" 
ON public.rpg_armors 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own armors" 
ON public.rpg_armors 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_rpg_weapons_updated_at
BEFORE UPDATE ON public.rpg_weapons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rpg_armors_updated_at
BEFORE UPDATE ON public.rpg_armors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();