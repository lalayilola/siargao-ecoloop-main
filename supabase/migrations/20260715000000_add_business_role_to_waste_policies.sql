-- Update projected waste reports RLS policies to use restaurant role
-- This allows restaurant owners (including hotels and other businesses) to post waste reports

-- Drop existing policies
DROP POLICY IF EXISTS "Business owners can view own projected waste reports" ON projected_waste_reports;
DROP POLICY IF EXISTS "Business owners can create projected waste reports" ON projected_waste_reports;
DROP POLICY IF EXISTS "Business owners can update own projected waste reports" ON projected_waste_reports;
DROP POLICY IF EXISTS "Business owners can delete own projected waste reports" ON projected_waste_reports;

-- Recreate policies using restaurant role
-- Restaurant owners can view their own projected waste reports
CREATE POLICY "Business owners can view own projected waste reports"
  ON projected_waste_reports FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'restaurant'
    )
  );

-- Only restaurant owners can create projected waste reports
CREATE POLICY "Business owners can create projected waste reports"
  ON projected_waste_reports FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.primary_role = 'restaurant'
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
      AND profiles.primary_role = 'restaurant'
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
      AND profiles.primary_role = 'restaurant'
    )
  );
