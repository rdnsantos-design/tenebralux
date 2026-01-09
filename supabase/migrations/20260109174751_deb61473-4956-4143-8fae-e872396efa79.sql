-- Remover constraint antiga e adicionar uma mais flexível
ALTER TABLE public.galaxy_planets DROP CONSTRAINT IF EXISTS galaxy_planets_r_check;
ALTER TABLE public.galaxy_planets ADD CONSTRAINT galaxy_planets_r_check CHECK (r >= 0 AND r <= 15);

ALTER TABLE public.galaxy_planets DROP CONSTRAINT IF EXISTS galaxy_planets_d_check;
ALTER TABLE public.galaxy_planets ADD CONSTRAINT galaxy_planets_d_check CHECK (d >= 0 AND d <= 15);