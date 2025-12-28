-- Add region and culture columns to realms table
ALTER TABLE public.realms 
ADD COLUMN region text,
ADD COLUMN culture text;