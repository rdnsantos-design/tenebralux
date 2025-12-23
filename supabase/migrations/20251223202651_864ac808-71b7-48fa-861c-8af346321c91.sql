-- Table for storing distances between provinces
CREATE TABLE public.province_distances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_province_name TEXT NOT NULL,
  to_province_name TEXT NOT NULL,
  distance_km NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_province_name, to_province_name)
);

-- Enable RLS
ALTER TABLE public.province_distances ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view distances" ON public.province_distances FOR SELECT USING (true);
CREATE POLICY "Anyone can insert distances" ON public.province_distances FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update distances" ON public.province_distances FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete distances" ON public.province_distances FOR DELETE USING (true);

-- Travel speed configuration table
CREATE TABLE public.travel_speeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_type TEXT NOT NULL UNIQUE, -- 'individual' or 'army'
  label TEXT NOT NULL,
  speed_km_per_day NUMERIC(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.travel_speeds ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view travel speeds" ON public.travel_speeds FOR SELECT USING (true);
CREATE POLICY "Anyone can insert travel speeds" ON public.travel_speeds FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update travel speeds" ON public.travel_speeds FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete travel speeds" ON public.travel_speeds FOR DELETE USING (true);

-- Insert default travel speeds
INSERT INTO public.travel_speeds (travel_type, label, speed_km_per_day, description) VALUES
('individual', 'Indivíduo/Mensageiro', 40, 'Viajantes leves, mensageiros a cavalo'),
('army', 'Exército/Caravana', 20, 'Tropas marchando, caravanas comerciais');

-- Index for faster lookups
CREATE INDEX idx_province_distances_from ON public.province_distances (from_province_name);
CREATE INDEX idx_province_distances_to ON public.province_distances (to_province_name);
CREATE INDEX idx_province_distances_pair ON public.province_distances (from_province_name, to_province_name);