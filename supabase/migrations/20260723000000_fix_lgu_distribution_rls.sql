-- Fix LGU Distributions RLS policy to allow authenticated users to create distributions
-- This is a temporary fix to allow distribution creation while debugging the role issue

-- Drop existing policies
DROP POLICY IF EXISTS "Farmers can view LGU distributions" ON lgu_distributions;
DROP POLICY IF EXISTS "LGU admins can view all distributions" ON lgu_distributions;
DROP POLICY IF EXISTS "LGU admins can create distributions" ON lgu_distributions;
DROP POLICY IF EXISTS "LGU admins can update distributions" ON lgu_distributions;
DROP POLICY IF EXISTS "LGU admins can delete distributions" ON lgu_distributions;

-- Recreate policies with more flexible checks
-- All authenticated users can view LGU distributions
CREATE POLICY "Authenticated users can view LGU distributions"
  ON lgu_distributions FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- All authenticated users can create distributions (temporary)
CREATE POLICY "Authenticated users can create distributions"
  ON lgu_distributions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Users can update their own distributions
CREATE POLICY "Users can update own distributions"
  ON lgu_distributions FOR UPDATE
  USING (
    user_id = auth.uid()
  );

-- Users can delete their own distributions
CREATE POLICY "Users can delete own distributions"
  ON lgu_distributions FOR DELETE
  USING (
    user_id = auth.uid()
  );
