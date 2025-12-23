-- Create enum for holding types
CREATE TYPE public.holding_type AS ENUM ('ordem', 'guilda', 'templo', 'fonte_magica');

-- Create regents table
CREATE TABLE public.regents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on regents
ALTER TABLE public.regents ENABLE ROW LEVEL SECURITY;

-- RLS policies for regents
CREATE POLICY "Anyone can view regents" ON public.regents FOR SELECT USING (true);
CREATE POLICY "Anyone can insert regents" ON public.regents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update regents" ON public.regents FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete regents" ON public.regents FOR DELETE USING (true);

-- Create holdings table
CREATE TABLE public.holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  province_id UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  holding_type public.holding_type NOT NULL,
  regent_id UUID REFERENCES public.regents(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on holdings
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- RLS policies for holdings
CREATE POLICY "Anyone can view holdings" ON public.holdings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert holdings" ON public.holdings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update holdings" ON public.holdings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete holdings" ON public.holdings FOR DELETE USING (true);

-- Create index for better performance
CREATE INDEX idx_holdings_province ON public.holdings(province_id);
CREATE INDEX idx_holdings_regent ON public.holdings(regent_id);
CREATE INDEX idx_holdings_type ON public.holdings(holding_type);