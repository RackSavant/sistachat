-- Fix storage policies for sistachat folder structure
-- The new path structure is: sistachat/{user_id}/{timestamp}-{filename}
-- So we need to extract the second path segment as the user_id

-- Drop existing raw-images policies
DROP POLICY IF EXISTS "authenticate_users_raw_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "authenticate_users_raw_images_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticate_users_raw_images_select" ON storage.objects;

-- Create new policies for sistachat folder structure
-- Path pattern: sistachat/{user_id}/{filename}
-- Extract user_id from the second path segment

CREATE POLICY "authenticate_users_raw_images_insert" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'raw-images' AND 
  (storage.foldername(name))[2]::uuid = auth.uid()
);

CREATE POLICY "authenticate_users_raw_images_update" ON storage.objects 
FOR UPDATE TO authenticated 
USING (
  bucket_id = 'raw-images' AND 
  (storage.foldername(name))[2]::uuid = auth.uid()
);

CREATE POLICY "authenticate_users_raw_images_select" ON storage.objects 
FOR SELECT TO authenticated 
USING (
  bucket_id = 'raw-images' AND 
  (storage.foldername(name))[2]::uuid = auth.uid()
);

-- Also add a public read policy for the sistachat folder structure
CREATE POLICY "public_read_raw_images_sistachat" ON storage.objects 
FOR SELECT TO public 
USING (
  bucket_id = 'raw-images' AND 
  name LIKE 'sistachat/%'
);
