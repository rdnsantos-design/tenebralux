
-- Corrigir search_path na função confirm_main
ALTER FUNCTION public.confirm_main(uuid, text) SET search_path = public;
