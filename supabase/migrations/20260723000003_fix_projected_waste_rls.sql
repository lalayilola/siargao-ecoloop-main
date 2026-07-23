-- Fix RLS policy for projected_waste_reports table
-- This migration temporarily relaxes RLS policies to allow authenticated users to manage their own projected waste reports

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own projected waste reports" ON projected_waste_reports;
DROP POLICY IF EXISTS "Users can insert own projected waste reports" ON projected_waste_reports;
DROP POLICY IF EXISTS "Users can update own projected waste reports" ON projected_waste_reports;
DROP POLICY IF EXISTS "Users can delete own projected waste reports" ON projected_waste_reports;

-- Create new policies that allow authenticated users to manage their own projected waste reports
CREATE POLICY "Users can view own projected waste reports"
  ON projected_waste_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projected waste reports"
  ON projected_waste_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projected waste reports"
  ON projected_waste_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projected waste reports"
  ON projected_waste_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
