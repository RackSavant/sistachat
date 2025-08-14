-- Temporary public upload policy for testing
-- This allows uploads to the sistachat folder without authentication
-- REMOVE THIS IN PRODUCTION!

CREATE POLICY "temp_public_upload_sistachat" ON storage.objects 
FOR INSERT TO public 
WITH CHECK (
  bucket_id = 'raw-images' AND 
  name LIKE 'sistachat/%'
);

-- Also ensure public read access
DROP POLICY IF EXISTS "public_read_raw_images_sistachat" ON storage.objects;

CREATE POLICY "public_read_raw_images_sistachat" ON storage.objects 
FOR SELECT TO public 
USING (
  bucket_id = 'raw-images' AND 
  name LIKE 'sistachat/%'
);
