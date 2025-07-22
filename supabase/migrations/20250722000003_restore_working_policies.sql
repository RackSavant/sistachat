-- Restore the working RLS policies from 1:14 PM
-- Revert back to the original path structure: {user_id}/{filename}

-- Drop the sistachat-specific policies
DROP POLICY IF EXISTS "authenticate_users_raw_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "authenticate_users_raw_images_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticate_users_raw_images_select" ON storage.objects;
DROP POLICY IF EXISTS "public_read_raw_images_sistachat" ON storage.objects;
DROP POLICY IF EXISTS "temp_public_upload_sistachat" ON storage.objects;

-- Restore the original working policies for path structure: {user_id}/{filename}
CREATE POLICY "authenticate_users_raw_images_insert" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'raw-images' AND 
  substring(name from '^([^/]+)')::uuid = auth.uid()
);

CREATE POLICY "authenticate_users_raw_images_update" ON storage.objects 
FOR UPDATE TO authenticated 
USING (
  bucket_id = 'raw-images' AND 
  substring(name from '^([^/]+)')::uuid = auth.uid()
);

CREATE POLICY "authenticate_users_raw_images_select" ON storage.objects 
FOR SELECT TO authenticated 
USING (
  bucket_id = 'raw-images' AND 
  substring(name from '^([^/]+)')::uuid = auth.uid()
);

-- Add public read policy for the raw-images bucket
CREATE POLICY "public_read_raw_images" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'raw-images');
