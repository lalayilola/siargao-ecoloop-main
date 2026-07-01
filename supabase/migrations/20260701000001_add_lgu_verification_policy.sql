-- Create RLS policy to allow LGU admins to update lgu_approved field
-- This policy allows users with lgu_admin role to update the lgu_approved column

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "lgu_admins_can_update_lgu_approved" ON profiles;

-- Create policy that allows LGU admins to update lgu_approved
CREATE POLICY "lgu_admins_can_update_lgu_approved"
ON profiles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE primary_role = 'lgu_admin' 
    AND municipality = (SELECT municipality FROM profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE primary_role = 'lgu_admin' 
    AND municipality = (SELECT municipality FROM profiles WHERE id = auth.uid())
  )
);
