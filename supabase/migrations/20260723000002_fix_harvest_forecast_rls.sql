-- Fix RLS policy for harvest_forecasts table
-- This migration temporarily relaxes RLS policies to allow authenticated users to manage their own harvest forecasts

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own harvest forecasts" ON harvest_forecasts;
DROP POLICY IF EXISTS "Users can insert own harvest forecasts" ON harvest_forecasts;
DROP POLICY IF EXISTS "Users can update own harvest forecasts" ON harvest_forecasts;
DROP POLICY IF EXISTS "Users can delete own harvest forecasts" ON harvest_forecasts;

-- Create new policies that allow authenticated users to manage their own harvest forecasts
CREATE POLICY "Users can view own harvest forecasts"
  ON harvest_forecasts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own harvest forecasts"
  ON harvest_forecasts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own harvest forecasts"
  ON harvest_forecasts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own harvest forecasts"
  ON harvest_forecasts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
