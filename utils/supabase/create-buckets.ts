import { createClient } from '@supabase/supabase-js';

// This script creates the necessary storage buckets for SisterChat
// Run with: npx tsx utils/supabase/create-buckets.ts

async function createBuckets() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Create outfits bucket for storing outfit images and audio feedback
  try {
    const { data: outfitsBucket, error: outfitsError } = await supabase.storage.createBucket(
      'outfits',
      {
        public: true, // Public for easy access from Mentra glasses
        fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp3']
      }
    );

    if (outfitsError) {
      console.error('❌ Error creating outfits bucket:', outfitsError.message);
    } else {
      console.log('✅ Outfits bucket created or already exists');
      
      // Update bucket policies to be public
      const { error: policyError } = await supabase.storage.from('outfits').createSignedUrl('test.txt', 60);
      if (policyError) {
        console.log('ℹ️ You may need to set bucket policies in the Supabase Dashboard');
      } else {
        console.log('✅ Outfits bucket is accessible');
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error creating outfits bucket:', err);
  }
  
  // Create raw-images bucket for storing original photos from Mentra glasses
  try {
    const { data: rawImagesBucket, error: rawImagesError } = await supabase.storage.createBucket(
      'raw-images',
      {
        public: true, // Public for easy access from Mentra glasses
        fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    );

    if (rawImagesError) {
      console.error('❌ Error creating raw-images bucket:', rawImagesError.message);
    } else {
      console.log('✅ Raw-images bucket created or already exists');
    }
  } catch (err) {
    console.error('❌ Unexpected error creating raw-images bucket:', err);
  }

  // You can add more buckets here as needed (e.g., profile pictures, etc.)
  console.log('🎉 Storage setup complete');
}

createBuckets().catch(console.error); 