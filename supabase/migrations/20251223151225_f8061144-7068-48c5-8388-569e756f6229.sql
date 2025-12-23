-- Create realms (kingdoms) table
CREATE TABLE public.realms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provinces table
CREATE TABLE public.provinces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  realm_id UUID NOT NULL REFERENCES public.realms(id) ON DELETE CASCADE,
  development INTEGER NOT NULL DEFAULT 0 CHECK (development >= 0 AND development <= 10),
  magic INTEGER NOT NULL DEFAULT 0 CHECK (magic >= 0 AND magic <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, realm_id)
);

-- Enable RLS
ALTER TABLE public.realms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;

-- RLS policies for realms
CREATE POLICY "Anyone can view realms" ON public.realms FOR SELECT USING (true);
CREATE POLICY "Anyone can insert realms" ON public.realms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update realms" ON public.realms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete realms" ON public.realms FOR DELETE USING (true);

-- RLS policies for provinces
CREATE POLICY "Anyone can view provinces" ON public.provinces FOR SELECT USING (true);
CREATE POLICY "Anyone can insert provinces" ON public.provinces FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update provinces" ON public.provinces FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete provinces" ON public.provinces FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_provinces_realm_id ON public.provinces(realm_id);

-- Trigger for updated_at on realms
CREATE TRIGGER update_realms_updated_at
  BEFORE UPDATE ON public.realms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tactical_cards_updated_at();

-- Trigger for updated_at on provinces
CREATE TRIGGER update_provinces_updated_at
  BEFORE UPDATE ON public.provinces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tactical_cards_updated_at();