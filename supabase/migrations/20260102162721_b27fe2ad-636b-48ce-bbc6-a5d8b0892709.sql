-- Fix database linter: ensure stable search_path on functions
ALTER FUNCTION public.shuffle_jsonb_array(arr jsonb)
  SET search_path TO public;