-- Add lgu_approved column to profiles table
-- This column tracks whether a user has been verified by LGU admin
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS lgu_approved BOOLEAN DEFAULT FALSE;

-- Add government_id_url column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS government_id_url TEXT;

-- Create index on lgu_approved for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_lgu_approved ON profiles(lgu_approved);
