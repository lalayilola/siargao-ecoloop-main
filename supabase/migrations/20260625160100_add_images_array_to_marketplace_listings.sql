-- Add images array column to marketplace_listings to support multiple image uploads
-- This allows users to upload multiple pictures in their marketplace listings

-- Add the images column as a TEXT array
ALTER TABLE marketplace_listings 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add a comment to document the new column
COMMENT ON COLUMN marketplace_listings.images IS 'Array of image URLs for listings with multiple pictures';
