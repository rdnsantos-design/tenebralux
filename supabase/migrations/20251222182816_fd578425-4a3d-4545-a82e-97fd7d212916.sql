-- Create enum for specializations
CREATE TYPE public.commander_specialization AS ENUM (
  'Infantaria',
  'Cavalaria',
  'Arqueiro',
  'Cerco',
  'Milicia',
  'Elite',
  'Naval'
);

-- Create commanders table
CREATE TABLE public.field_commanders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_comandante TEXT NOT NULL,
  cultura_origem TEXT NOT NULL,
  especializacao_inicial TEXT NOT NULL,
  comando INTEGER NOT NULL DEFAULT 1,
  estrategia INTEGER NOT NULL DEFAULT 0,
  guarda INTEGER NOT NULL DEFAULT 3,
  pontos_prestigio INTEGER NOT NULL DEFAULT 0,
  especializacoes_adicionais TEXT[] NOT NULL DEFAULT '{}',
  unidade_de_origem TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.field_commanders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view commanders" 
ON public.field_commanders 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert commanders" 
ON public.field_commanders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update commanders" 
ON public.field_commanders 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete commanders" 
ON public.field_commanders 
FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_field_commanders_updated_at
BEFORE UPDATE ON public.field_commanders
FOR EACH ROW
EXECUTE FUNCTION public.update_tactical_cards_updated_at();