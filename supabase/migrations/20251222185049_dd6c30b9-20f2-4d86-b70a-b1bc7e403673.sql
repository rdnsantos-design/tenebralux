-- Adicionar coluna regent_id na tabela field_commanders para associar comandantes a regentes
ALTER TABLE public.field_commanders
ADD COLUMN regent_id TEXT DEFAULT NULL;

-- Criar índice para otimizar buscas por regente
CREATE INDEX idx_field_commanders_regent_id ON public.field_commanders(regent_id);