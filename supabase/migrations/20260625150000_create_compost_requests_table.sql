-- Create compost_requests table
CREATE TABLE IF NOT EXISTS compost_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  compost_inventory_id UUID NOT NULL REFERENCES compost_inventory(id) ON DELETE CASCADE,
  quantity_requested_kg NUMERIC NOT NULL,
  request_date DATE NOT NULL,
  collection_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ready', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE compost_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for compost_requests
CREATE POLICY "Farmers can view their own compost requests"
ON compost_requests FOR SELECT
TO authenticated
USING (
  farmer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.primary_role = 'farmer'
  )
);

CREATE POLICY "Farmers can insert compost requests"
ON compost_requests FOR INSERT
TO authenticated
WITH CHECK (
  farmer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.primary_role = 'farmer'
  )
);

CREATE POLICY "LGU admins can view all compost requests"
ON compost_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.primary_role = 'lgu_admin'
  )
);

CREATE POLICY "LGU admins can update compost requests"
ON compost_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.primary_role = 'lgu_admin'
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_compost_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compost_requests_updated_at
BEFORE UPDATE ON compost_requests
FOR EACH ROW
EXECUTE FUNCTION update_compost_requests_updated_at();
