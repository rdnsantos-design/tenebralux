
-- Corrigir search_path na função confirm_initiative
ALTER FUNCTION public.confirm_initiative(uuid, text) SET search_path = public;
