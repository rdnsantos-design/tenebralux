-- Create table for galaxy organizations
CREATE TABLE public.galaxy_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('corporacao', 'militar', 'criminosa', 'cientifica', 'social')),
  description TEXT,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.galaxy_organizations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Anyone can read organizations" 
ON public.galaxy_organizations 
FOR SELECT 
USING (true);

-- Allow anyone to manage for now
CREATE POLICY "Anyone can insert organizations" 
ON public.galaxy_organizations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update organizations" 
ON public.galaxy_organizations 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete organizations" 
ON public.galaxy_organizations 
FOR DELETE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_galaxy_organizations_updated_at
BEFORE UPDATE ON public.galaxy_organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();