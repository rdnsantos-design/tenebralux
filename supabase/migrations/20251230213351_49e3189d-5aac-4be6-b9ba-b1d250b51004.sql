-- Create table for purchasable commander templates in mass combat
CREATE TABLE public.mass_combat_commander_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero integer NOT NULL UNIQUE,
  comando integer NOT NULL DEFAULT 1,
  estrategia integer NOT NULL DEFAULT 1,
  guarda integer NOT NULL DEFAULT 2,
  especializacao text NOT NULL,
  custo_vet integer NOT NULL DEFAULT 4,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mass_combat_commander_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view commander templates"
ON public.mass_combat_commander_templates
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert commander templates"
ON public.mass_combat_commander_templates
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update commander templates"
ON public.mass_combat_commander_templates
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete commander templates"
ON public.mass_combat_commander_templates
FOR DELETE
USING (true);

-- Insert the 15 commander templates
INSERT INTO public.mass_combat_commander_templates (numero, comando, estrategia, guarda, especializacao, custo_vet) VALUES
(1, 1, 1, 2, 'Arqueria', 4),
(2, 2, 1, 2, 'Arqueria', 5),
(3, 2, 2, 4, 'Arqueria', 8),
(4, 1, 1, 2, 'Infantaria', 4),
(5, 2, 1, 2, 'Infantaria', 5),
(6, 2, 2, 4, 'Infantaria', 8),
(7, 1, 1, 2, 'Cavalaria', 4),
(8, 2, 1, 2, 'Cavalaria', 5),
(9, 2, 2, 4, 'Cavalaria', 8),
(10, 3, 2, 4, 'Inf + Arq', 12),
(11, 3, 2, 4, 'Inf + Cav', 12),
(12, 3, 2, 4, 'Arq + Cav', 12),
(13, 3, 3, 4, 'Inf + Arq', 13),
(14, 3, 3, 4, 'Inf + Cav', 13),
(15, 3, 3, 4, 'Arq + Cav', 13);