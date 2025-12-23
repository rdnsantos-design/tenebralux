-- Add commander photo and coat of arms fields
ALTER TABLE public.field_commanders
ADD COLUMN commander_photo_url text DEFAULT NULL,
ADD COLUMN coat_of_arms_url text DEFAULT NULL;