-- Add new fields to provinces table

-- Main terrain type
ALTER TABLE public.provinces 
ADD COLUMN terrain_type text;

-- Connections (boolean for each type)
ALTER TABLE public.provinces 
ADD COLUMN has_port boolean NOT NULL DEFAULT false,
ADD COLUMN has_river boolean NOT NULL DEFAULT false,
ADD COLUMN has_path boolean NOT NULL DEFAULT false;

-- Structures with levels (0 = none, 1-3 = levels)
ALTER TABLE public.provinces 
ADD COLUMN road_level integer NOT NULL DEFAULT 0 CHECK (road_level >= 0 AND road_level <= 3),
ADD COLUMN arcane_line_level integer NOT NULL DEFAULT 0 CHECK (arcane_line_level >= 0 AND arcane_line_level <= 3),
ADD COLUMN fortification_level integer NOT NULL DEFAULT 0 CHECK (fortification_level >= 0 AND fortification_level <= 3);