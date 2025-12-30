-- =====================================================
-- PASSO 2: Migração de Unidades para Supabase
-- =====================================================

-- Enum para níveis de experiência
CREATE TYPE public.experience_level AS ENUM (
  'Amador',
  'Recruta', 
  'Profissional',
  'Veterano',
  'Elite',
  'Lendário'
);

-- Enum para posturas de combate
CREATE TYPE public.unit_posture AS ENUM (
  'Ofensiva',
  'Defensiva',
  'Carga',
  'Reorganização'
);

-- =====================================================
-- Tabela: unit_templates (Templates/modelos base)
-- =====================================================
CREATE TABLE public.unit_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificação
  name TEXT NOT NULL,
  source_file TEXT, -- arquivo Excel de origem
  
  -- Atributos base (1-6)
  attack INTEGER NOT NULL DEFAULT 3 CHECK (attack >= 1 AND attack <= 6),
  defense INTEGER NOT NULL DEFAULT 3 CHECK (defense >= 1 AND defense <= 6),
  ranged INTEGER NOT NULL DEFAULT 0 CHECK (ranged >= 0 AND ranged <= 6),
  movement INTEGER NOT NULL DEFAULT 3 CHECK (movement >= 1 AND movement <= 6),
  morale INTEGER NOT NULL DEFAULT 3 CHECK (morale >= 1 AND morale <= 6),
  
  -- Outros atributos
  experience public.experience_level NOT NULL DEFAULT 'Profissional',
  total_force INTEGER NOT NULL DEFAULT 10,
  maintenance_cost INTEGER NOT NULL DEFAULT 1,
  
  -- Habilidades especiais (JSONB array)
  special_abilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Visual
  background_image TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Tabela: unit_instances (Instâncias de unidades criadas)
-- =====================================================
CREATE TABLE public.unit_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relacionamentos
  template_id UUID REFERENCES public.unit_templates(id) ON DELETE SET NULL,
  regent_id UUID REFERENCES public.regents(id) ON DELETE CASCADE,
  army_id UUID, -- será atualizado quando tivermos tabela de exércitos
  commander_id UUID REFERENCES public.field_commanders(id) ON DELETE SET NULL,
  
  -- Identificação
  name TEXT NOT NULL,
  unit_number TEXT, -- número para distinguir unidades iguais
  
  -- Atributos (podem ser diferentes do template após evoluções)
  attack INTEGER NOT NULL DEFAULT 3,
  defense INTEGER NOT NULL DEFAULT 3,
  ranged INTEGER NOT NULL DEFAULT 0,
  movement INTEGER NOT NULL DEFAULT 3,
  morale INTEGER NOT NULL DEFAULT 3,
  
  -- Outros atributos
  experience public.experience_level NOT NULL DEFAULT 'Profissional',
  total_force INTEGER NOT NULL DEFAULT 10,
  maintenance_cost INTEGER NOT NULL DEFAULT 1,
  creation_cost INTEGER NOT NULL DEFAULT 3,
  
  -- Habilidades especiais
  special_abilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Progressão
  current_xp INTEGER NOT NULL DEFAULT 0,
  battles_fought INTEGER NOT NULL DEFAULT 0,
  battles_won INTEGER NOT NULL DEFAULT 0,
  
  -- Localização
  province_id UUID REFERENCES public.provinces(id) ON DELETE SET NULL,
  is_garrisoned BOOLEAN NOT NULL DEFAULT false,
  
  -- Visual
  background_image TEXT,
  custom_background_image TEXT,
  
  -- Estado em jogo
  current_posture public.unit_posture,
  normal_pressure INTEGER NOT NULL DEFAULT 0,
  permanent_pressure INTEGER NOT NULL DEFAULT 0,
  hits INTEGER NOT NULL DEFAULT 0,
  is_disbanded BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Índices para performance
-- =====================================================
CREATE INDEX idx_unit_templates_name ON public.unit_templates(name);
CREATE INDEX idx_unit_instances_regent ON public.unit_instances(regent_id);
CREATE INDEX idx_unit_instances_army ON public.unit_instances(army_id);
CREATE INDEX idx_unit_instances_template ON public.unit_instances(template_id);
CREATE INDEX idx_unit_instances_province ON public.unit_instances(province_id);

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE public.unit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_instances ENABLE ROW LEVEL SECURITY;

-- Templates: acesso público (são modelos compartilhados)
CREATE POLICY "Anyone can view unit templates"
  ON public.unit_templates FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert unit templates"
  ON public.unit_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update unit templates"
  ON public.unit_templates FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete unit templates"
  ON public.unit_templates FOR DELETE
  USING (true);

-- Instâncias: acesso público (por enquanto, sem auth)
CREATE POLICY "Anyone can view unit instances"
  ON public.unit_instances FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert unit instances"
  ON public.unit_instances FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update unit instances"
  ON public.unit_instances FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete unit instances"
  ON public.unit_instances FOR DELETE
  USING (true);

-- =====================================================
-- Triggers para updated_at
-- =====================================================
CREATE TRIGGER update_unit_templates_updated_at
  BEFORE UPDATE ON public.unit_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unit_instances_updated_at
  BEFORE UPDATE ON public.unit_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.unit_templates IS 'Templates base de unidades militares, importados do Excel';
COMMENT ON TABLE public.unit_instances IS 'Instâncias de unidades criadas a partir dos templates';