-- Create storage bucket for card background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-backgrounds', 'card-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Public read access for card backgrounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'card-backgrounds');

-- Create policy for authenticated uploads (or public for now since no auth)
CREATE POLICY "Anyone can upload card backgrounds"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'card-backgrounds');

-- Create policy for delete
CREATE POLICY "Anyone can delete card backgrounds"
ON storage.objects FOR DELETE
USING (bucket_id = 'card-backgrounds');

-- Create table to track image metadata
CREATE TABLE public.card_background_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 750,
  height INTEGER NOT NULL DEFAULT 1050,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tags TEXT[] DEFAULT '{}'::TEXT[],
  description TEXT
);

-- Enable RLS
ALTER TABLE public.card_background_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view card background images"
ON public.card_background_images FOR SELECT
USING (true);

-- Public insert access
CREATE POLICY "Anyone can insert card background images"
ON public.card_background_images FOR INSERT
WITH CHECK (true);

-- Public delete access
CREATE POLICY "Anyone can delete card background images"
ON public.card_background_images FOR DELETE
USING (true);