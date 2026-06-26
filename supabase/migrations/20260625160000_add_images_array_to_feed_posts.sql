-- Add images array column to feed_posts to support multiple image uploads
-- This allows farmers to upload multiple pictures in their posts

-- Add the images column as a TEXT array
ALTER TABLE feed_posts 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add a comment to document the new column
COMMENT ON COLUMN feed_posts.images IS 'Array of image URLs for posts with multiple pictures';
