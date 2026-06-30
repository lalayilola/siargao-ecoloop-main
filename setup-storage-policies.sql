-- Storage Bucket RLS Policies for EcoLoop Siargao
-- Run this in your Supabase SQL Editor to fix government ID upload errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to upload to uploads bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Policy: Allow all authenticated users to view files in uploads bucket
CREATE POLICY "Allow authenticated select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'uploads');

-- Policy: Allow all authenticated users to update their files
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads');

-- Policy: Allow all authenticated users to delete their files
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA storage TO authenticated;
