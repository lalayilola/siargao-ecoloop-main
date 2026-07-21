-- Add image_urls array column to messages table for multiple image support
-- First, create the new column
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Migrate existing single image_url to image_urls array
UPDATE public.messages 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_urls IS NULL;

-- Drop the old column after migration (optional - keeping for now for safety)
-- ALTER TABLE public.messages DROP COLUMN IF EXISTS image_url;
