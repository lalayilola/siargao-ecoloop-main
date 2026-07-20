-- Add cover_photo_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN cover_photo_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN profiles.cover_photo_url IS 'URL of the user profile cover photo/banner image';
