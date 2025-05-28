import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function setupStorageBuckets() {
  try {
    console.log('Setting up storage buckets...');

    // Create raw-images bucket
    const { data: rawBucket, error: rawError } = await supabase.storage
      .createBucket('raw-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760, // 10MB
      });

    if (rawError && !rawError.message.includes('already exists')) {
      console.error('Error creating raw-images bucket:', rawError);
    } else {
      console.log('✅ raw-images bucket ready');
    }

    // Create processed-images bucket
    const { data: processedBucket, error: processedError } = await supabase.storage
      .createBucket('processed-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760, // 10MB
      });

    if (processedError && !processedError.message.includes('already exists')) {
      console.error('Error creating processed-images bucket:', processedError);
    } else {
      console.log('✅ processed-images bucket ready');
    }

    // Create outfits bucket (for backward compatibility)
    const { data: outfitsBucket, error: outfitsError } = await supabase.storage
      .createBucket('outfits', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760, // 10MB
      });

    if (outfitsError && !outfitsError.message.includes('already exists')) {
      console.error('Error creating outfits bucket:', outfitsError);
    } else {
      console.log('✅ outfits bucket ready');
    }

    console.log('Storage buckets setup complete!');
    return true;
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
    return false;
  }
}

// Run this if called directly
if (require.main === module) {
  setupStorageBuckets().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
} 