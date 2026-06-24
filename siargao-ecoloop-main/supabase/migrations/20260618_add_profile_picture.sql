-- Add profile_picture_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN profile_picture_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.profile_picture_url IS 'URL to the user profile picture stored in Supabase Storage';
