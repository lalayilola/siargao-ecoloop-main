-- Create compost_inventory table
CREATE TABLE IF NOT EXISTS compost_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lgu_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compost_type TEXT NOT NULL,
  quantity_kg NUMERIC NOT NULL DEFAULT 0,
  production_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'distributed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE compost_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for compost_inventory
CREATE POLICY "LGU admins can view all compost inventory"
ON compost_inventory FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.primary_role = 'lgu_admin'
  )
);

CREATE POLICY "LGU admins can insert compost inventory"
ON compost_inventory FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.primary_role = 'lgu_admin'
  )
);

CREATE POLICY "LGU admins can update compost inventory"
ON compost_inventory FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.primary_role = 'lgu_admin'
  )
);

CREATE POLICY "Farmers can view available compost"
ON compost_inventory FOR SELECT
TO authenticated
USING (
  status = 'available' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.primary_role = 'farmer'
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_compost_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compost_inventory_updated_at
BEFORE UPDATE ON compost_inventory
FOR EACH ROW
EXECUTE FUNCTION update_compost_inventory_updated_at();
