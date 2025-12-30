-- Adicionar coluna user_id às tabelas de dados do usuário
-- Tabelas que contêm dados específicos de cada usuário

ALTER TABLE public.regents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.character_cards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.field_commanders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.unit_instances ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.unit_templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.realms ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.provinces ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_regents_user_id ON public.regents(user_id);
CREATE INDEX IF NOT EXISTS idx_character_cards_user_id ON public.character_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_field_commanders_user_id ON public.field_commanders(user_id);
CREATE INDEX IF NOT EXISTS idx_unit_instances_user_id ON public.unit_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_unit_templates_user_id ON public.unit_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_realms_user_id ON public.realms(user_id);
CREATE INDEX IF NOT EXISTS idx_provinces_user_id ON public.provinces(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);