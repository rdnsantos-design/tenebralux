-- Create table for galaxy lore content
CREATE TABLE public.galaxy_lore_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL, -- intro, historia, faccoes, corporacoes, atlas, timeline, politica
  faction_id TEXT, -- for faction-specific content: synapsis, galatea, zonas-fantasmas, espaco-disputado, independentes
  sub_section TEXT, -- for faction sub-tabs: historia, cultura, sociedade, planetas, estetica, relacoes
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX galaxy_lore_sections_unique_key 
ON public.galaxy_lore_sections (section_type, COALESCE(faction_id, ''), COALESCE(sub_section, ''));

-- Enable RLS
ALTER TABLE public.galaxy_lore_sections ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (public lore)
CREATE POLICY "Anyone can read galaxy lore" 
ON public.galaxy_lore_sections 
FOR SELECT 
USING (true);

-- Allow anyone to insert/update/delete for now (you can restrict this later)
CREATE POLICY "Anyone can insert galaxy lore" 
ON public.galaxy_lore_sections 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update galaxy lore" 
ON public.galaxy_lore_sections 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete galaxy lore" 
ON public.galaxy_lore_sections 
FOR DELETE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_galaxy_lore_sections_updated_at
BEFORE UPDATE ON public.galaxy_lore_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections so they exist
INSERT INTO public.galaxy_lore_sections (section_type, title, content) VALUES
('intro', 'Bem-vindo à Galáxia', 'Insira aqui a introdução ao universo.'),
('historia', 'História da Galáxia', 'Insira aqui a história geral da galáxia.'),
('corporacoes', 'Corporações', 'Insira aqui informações sobre as megacorporações.'),
('atlas', 'Atlas Estelar', 'Insira aqui o atlas estelar.'),
('timeline', 'Linha do Tempo', 'Insira aqui a linha do tempo.'),
('politica', 'Política Galáctica', 'Insira aqui informações sobre política galáctica.');

-- Insert faction sections
INSERT INTO public.galaxy_lore_sections (section_type, faction_id, sub_section, title, content) 
SELECT 
  'faccoes',
  faction.id,
  sub.id,
  sub.label || ' - ' || faction.name,
  'Insira aqui o conteúdo sobre ' || sub.label || ' da facção ' || faction.name || '.'
FROM 
  (VALUES 
    ('synapsis', 'Synapsis'),
    ('galatea', 'Domínio de Galatea'),
    ('zonas-fantasmas', 'Zonas Fantasmas'),
    ('espaco-disputado', 'Espaço Disputado'),
    ('independentes', 'Independentes')
  ) AS faction(id, name),
  (VALUES 
    ('historia', 'História'),
    ('cultura', 'Cultura'),
    ('sociedade', 'Sociedade'),
    ('planetas', 'Planetas'),
    ('estetica', 'Estética'),
    ('relacoes', 'Relações')
  ) AS sub(id, label);