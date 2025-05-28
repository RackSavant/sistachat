-- Fix storage policies for image upload functionality
-- This migration addresses RLS policy issues preventing image uploads

-- First, drop existing policies that have incorrect regex patterns
DROP POLICY IF EXISTS "authenticate_users_raw_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "authenticate_users_raw_images_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticate_users_raw_images_select" ON storage.objects;

-- Create corrected policies for raw-images bucket
-- The path structure is: {user_id}/{timestamp}-{filename}
-- So we extract the first part before the slash as the user_id
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

-- Also fix the outfits bucket policies to be consistent
DROP POLICY IF EXISTS "authenticate_users_outfits_select" ON storage.objects;

CREATE POLICY "authenticate_users_outfits_select" ON storage.objects 
FOR SELECT TO authenticated 
USING (
  bucket_id = 'outfits' AND 
  substring(name from '^outfits/([^/]+)')::uuid = auth.uid()
);

-- Fix processed-images bucket policies
DROP POLICY IF EXISTS "authenticate_users_processed_images_select" ON storage.objects;

CREATE POLICY "authenticate_users_processed_images_select" ON storage.objects 
FOR SELECT TO authenticated 
USING (
  bucket_id = 'processed-images' AND 
  substring(name from '^([^/]+)')::uuid = auth.uid()
);
