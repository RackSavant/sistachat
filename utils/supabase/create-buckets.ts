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

  // Create outfits bucket
  try {
    const { data: outfitsBucket, error: outfitsError } = await supabase.storage.createBucket(
      'outfits',
      {
        public: false, // Private by default
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    );

    if (outfitsError) {
      console.error('❌ Error creating outfits bucket:', outfitsError.message);
    } else {
      console.log('✅ Outfits bucket created or already exists');
      
      // Note: Setting bucket policies requires using the Supabase Dashboard or SQL
      console.log('ℹ️ For bucket policies, set them in the Supabase Dashboard:');
      console.log('1. Go to Storage > Policies');
      console.log('2. Create a policy for "outfits" bucket that allows users to access only their own files');
      console.log('   Example policy: storage.foldername(1)::uuid = auth.uid()');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  // You can add more buckets here as needed (e.g., profile pictures, etc.)
  console.log('🎉 Storage setup complete');
}

createBuckets().catch(console.error); 