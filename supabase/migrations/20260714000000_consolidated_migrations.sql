-- Consolidated Migration File
-- This consolidates all root-level SQL files into proper migration format
-- Includes: Storage setup, Theme preferences, and Forecast tables

-- ============================================
-- STORAGE SETUP
-- ============================================

-- Create the uploads storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public access to view files in uploads bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Policy: Allow authenticated users to upload to uploads bucket
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Policy: Allow authenticated users to update their files
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads');

-- Policy: Allow authenticated users to delete their files
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA storage TO authenticated;

-- ============================================
-- THEME PREFERENCES
-- ============================================

-- Add theme preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_preferences jsonb DEFAULT '{"font":"Figtree","color_theme":"default","header_background":"default"}';

-- Update existing records to have the new structure
UPDATE profiles
SET theme_preferences = jsonb_set(
  theme_preferences,
  '{dark_mode}',
  'false'::jsonb
)
WHERE theme_preferences ? 'font';

UPDATE profiles
SET theme_preferences = jsonb_set(
  theme_preferences,
  '{border_radius}',
  '"medium"'::jsonb
)
WHERE theme_preferences ? 'font';

UPDATE profiles
SET theme_preferences = jsonb_set(
  theme_preferences,
  '{font_size}',
  '"medium"'::jsonb
)
WHERE theme_preferences ? 'font';

UPDATE profiles
SET theme_preferences = jsonb_set(
  theme_preferences,
  '{pagehero_design}',
  '"default"'::jsonb
)
WHERE theme_preferences ? 'font';

UPDATE profiles
SET theme_preferences = jsonb_set(
  theme_preferences,
  '{pagehero_background_url}',
  'null'::jsonb
)
WHERE theme_preferences ? 'font';

-- Remove old header_background_url field if it exists
UPDATE profiles
SET theme_preferences = theme_preferences - 'header_background_url'
WHERE theme_preferences ? 'header_background_url';

-- ============================================
-- FORECAST TABLES
-- ============================================

-- Harvest Forecasts Table (Farmers post expected harvests)
CREATE TABLE IF NOT EXISTS harvest_forecasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  estimated_quantity_kg NUMERIC NOT NULL,
  projected_harvest_date DATE NOT NULL,
  municipality TEXT NOT NULL,
  barangay TEXT NOT NULL,
  notes TEXT,
  images text[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LGU Distributions Table (LGU posts upcoming distributions)
CREATE TABLE IF NOT EXISTS lgu_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lgu_name TEXT NOT NULL,
  distribution_type TEXT NOT NULL, -- 'fertilizer', 'seeds', 'equipment', 'assistance'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  distribution_date DATE NOT NULL,
  location TEXT NOT NULL,
  target_beneficiaries TEXT[] DEFAULT ARRAY['farmer'], -- Array of roles
  municipality TEXT NOT NULL,
  barangay TEXT[] DEFAULT ARRAY[]::TEXT[],
  quantity_available INTEGER,
  images text[],
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'distributed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projected Waste Reports Table (Hotel owners post projected waste)
CREATE TABLE IF NOT EXISTS projected_waste_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL, -- 'hotel', 'restaurant', 'cafe'
  estimated_quantity_kg NUMERIC NOT NULL,
  projected_date DATE NOT NULL,
  waste_type TEXT NOT NULL, -- 'food', 'organic', 'mixed'
  municipality TEXT NOT NULL,
  barangay TEXT NOT NULL,
  notes TEXT,
  images text[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE harvest_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgu_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projected_waste_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FORECAST TABLES RLS POLICIES
-- ============================================

-- Drop existing forecast policies if they exist
DROP POLICY IF EXISTS "Anyone can view harvest forecasts" ON harvest_forecasts;
DROP POLICY IF EXISTS "Farmers can view harvest forecasts" ON harvest_forecasts;
DROP POLICY IF EXISTS "Restaurants can view harvest forecasts" ON harvest_forecasts;
DROP POLICY IF EXISTS "Residents can view harvest forecasts" ON harvest_forecasts;
DROP POLICY IF EXISTS "LGU admins can view harvest forecasts" ON harvest_forecasts;
DROP POLICY IF EXISTS "Farmers can create harvest forecasts" ON harvest_forecasts;
DROP POLICY IF EXISTS "Farmers can update own harvest forecasts" ON harvest_forecasts;
DROP POLICY IF EXISTS "Farmers can delete own harvest forecasts" ON harvest_forecasts;

DROP POLICY IF EXISTS "Farmers can view LGU distributions" ON lgu_distributions;
DROP POLICY IF EXISTS "LGU admins can view all distributions" ON lgu_distributions;
DROP POLICY IF EXISTS "LGU admins can create distributions" ON lgu_distributions;
DROP POLICY IF EXISTS "LGU admins can update distributions" ON lgu_distributions;
DROP POLICY IF EXISTS "LGU admins can delete distributions" ON lgu_distributions;

DROP POLICY IF EXISTS "LGU admins can view projected waste reports" ON projected_waste_reports;
DROP POLICY IF EXISTS "Restaurant owners can view own projected waste reports" ON projected_waste_reports;
DROP POLICY IF EXISTS "Business owners can create projected waste reports" ON projected_waste_reports;
DROP POLICY IF EXISTS "Business owners can update own projected waste reports" ON projected_waste_reports;
DROP POLICY IF EXISTS "Business owners can delete own projected waste reports" ON projected_waste_reports;

-- RLS Policies for Harvest Forecasts
-- Farmers can view harvest forecasts
CREATE POLICY "Farmers can view harvest forecasts"
  ON harvest_forecasts FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'farmer'
    )
  );

-- Restaurants can view harvest forecasts
CREATE POLICY "Restaurants can view harvest forecasts"
  ON harvest_forecasts FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'restaurant'
    )
  );

-- Residents can view harvest forecasts
CREATE POLICY "Residents can view harvest forecasts"
  ON harvest_forecasts FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'resident'
    )
  );

-- LGU admins can view harvest forecasts
CREATE POLICY "LGU admins can view harvest forecasts"
  ON harvest_forecasts FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'lgu_admin'
    )
  );

-- Only farmers can create harvest forecasts
CREATE POLICY "Farmers can create harvest forecasts"
  ON harvest_forecasts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'farmer'
    )
  );

-- Only the creator can update their own forecast
CREATE POLICY "Farmers can update own harvest forecasts"
  ON harvest_forecasts FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'farmer'
    )
  );

-- Only the creator can delete their own forecast
CREATE POLICY "Farmers can delete own harvest forecasts"
  ON harvest_forecasts FOR DELETE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'farmer'
    )
  );

-- RLS Policies for LGU Distributions
-- Farmers can view LGU distributions
CREATE POLICY "Farmers can view LGU distributions"
  ON lgu_distributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'farmer'
    )
  );

-- LGU admins can view all distributions
CREATE POLICY "LGU admins can view all distributions"
  ON lgu_distributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'lgu_admin'
    )
  );

-- Only LGU admins can create distributions
CREATE POLICY "LGU admins can create distributions"
  ON lgu_distributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'lgu_admin'
    )
  );

-- Only LGU admins can update distributions
CREATE POLICY "LGU admins can update distributions"
  ON lgu_distributions FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'lgu_admin'
    )
  );

-- Only LGU admins can delete distributions
CREATE POLICY "LGU admins can delete distributions"
  ON lgu_distributions FOR DELETE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'lgu_admin'
    )
  );

-- RLS Policies for Projected Waste Reports
-- Only LGU admins can view projected waste reports
CREATE POLICY "LGU admins can view projected waste reports"
  ON projected_waste_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'lgu_admin'
    )
  );

-- Restaurant/hotel owners can view their own projected waste reports
CREATE POLICY "Business owners can view own projected waste reports"
  ON projected_waste_reports FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role IN ('restaurant', 'hotel_restaurant')
    )
  );

-- Only restaurant/hotel owners can create projected waste reports
CREATE POLICY "Business owners can create projected waste reports"
  ON projected_waste_reports FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role IN ('restaurant', 'hotel_restaurant')
    )
  );

-- Only the creator can update their own report
CREATE POLICY "Business owners can update own projected waste reports"
  ON projected_waste_reports FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role IN ('restaurant', 'hotel_restaurant')
    )
  );

-- Only the creator can delete their own report
CREATE POLICY "Business owners can delete own projected waste reports"
  ON projected_waste_reports FOR DELETE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role IN ('restaurant', 'hotel_restaurant')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_harvest_forecasts_date ON harvest_forecasts(projected_harvest_date);
CREATE INDEX IF NOT EXISTS idx_harvest_forecasts_municipality ON harvest_forecasts(municipality);
CREATE INDEX IF NOT EXISTS idx_lgu_distributions_date ON lgu_distributions(distribution_date);
CREATE INDEX IF NOT EXISTS idx_lgu_distributions_municipality ON lgu_distributions(municipality);
CREATE INDEX IF NOT EXISTS idx_projected_waste_date ON projected_waste_reports(projected_date);
CREATE INDEX IF NOT EXISTS idx_projected_waste_municipality ON projected_waste_reports(municipality);
