import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

/**
 * Setup bucket policies for raw-images bucket
 * This script ensures the bucket has the correct RLS policies for public uploads
 * Run with: npx tsx utils/supabase/setup-bucket-policies.ts
 */

async function setupBucketPolicies() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables. Please set:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  console.log('🔧 Setting up Supabase storage bucket policies...');

  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if raw-images bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }

    const rawImagesBucket = buckets?.find(bucket => bucket.name === 'raw-images');
    
    if (!rawImagesBucket) {
      console.log('📦 Creating raw-images bucket...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(
        'raw-images',
        {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
        }
      );

      if (createError) {
        console.error('❌ Error creating raw-images bucket:', createError.message);
        return;
      }
      
      console.log('✅ Raw-images bucket created successfully');
    } else {
      console.log('✅ Raw-images bucket already exists');
      console.log('   Public:', rawImagesBucket.public);
      console.log('   File size limit:', rawImagesBucket.file_size_limit ? `${rawImagesBucket.file_size_limit / 1024 / 1024}MB` : 'Not set');
    }

    // Test bucket accessibility
    console.log('\n🧪 Testing bucket accessibility...');
    
    // Try to list files (should work with service key)
    const { data: files, error: listFilesError } = await supabase.storage
      .from('raw-images')
      .list('', { limit: 1 });

    if (listFilesError) {
      console.error('❌ Cannot access raw-images bucket:', listFilesError.message);
    } else {
      console.log('✅ Raw-images bucket is accessible');
      console.log(`   Found ${files?.length || 0} files in root`);
    }

    // Test upload with a small test file
    console.log('\n🧪 Testing upload functionality...');
    
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    const testPath = `test/${Date.now()}-test.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(testPath, testFile);

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError.message);
    } else {
      console.log('✅ Test upload successful');
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('raw-images')
        .getPublicUrl(testPath);
      
      console.log('🌐 Test file URL:', publicUrl);
      
      // Clean up test file
      await supabase.storage.from('raw-images').remove([testPath]);
      console.log('🗑️ Test file cleaned up');
    }

    console.log('\n📋 Bucket Policy Requirements:');
    console.log('   For the raw-images bucket to work properly, ensure these RLS policies exist:');
    console.log('   ');
    console.log('   1. SELECT Policy (for reading files):');
    console.log('      Policy Name: "Public read access for raw-images"');
    console.log('      Table: storage.objects');
    console.log('      Operation: SELECT');
    console.log('      Target roles: public');
    console.log('      USING expression: bucket_id = \'raw-images\'');
    console.log('   ');
    console.log('   2. INSERT Policy (for uploading files):');
    console.log('      Policy Name: "Authenticated users can upload to raw-images"');
    console.log('      Table: storage.objects');
    console.log('      Operation: INSERT');
    console.log('      Target roles: authenticated');
    console.log('      WITH CHECK expression: bucket_id = \'raw-images\' AND auth.uid()::text = (storage.foldername(name))[1]');
    console.log('   ');
    console.log('   3. UPDATE Policy (for updating file metadata):');
    console.log('      Policy Name: "Users can update their own files in raw-images"');
    console.log('      Table: storage.objects');
    console.log('      Operation: UPDATE');
    console.log('      Target roles: authenticated');
    console.log('      USING expression: bucket_id = \'raw-images\' AND auth.uid()::text = (storage.foldername(name))[1]');
    console.log('   ');
    console.log('   4. DELETE Policy (for deleting files):');
    console.log('      Policy Name: "Users can delete their own files in raw-images"');
    console.log('      Table: storage.objects');
    console.log('      Operation: DELETE');
    console.log('      Target roles: authenticated');
    console.log('      USING expression: bucket_id = \'raw-images\' AND auth.uid()::text = (storage.foldername(name))[1]');
    console.log('   ');
    console.log('💡 You can set these policies in the Supabase Dashboard:');
    console.log('   Storage > Policies > New Policy');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the setup
if (require.main === module) {
  setupBucketPolicies().catch(console.error);
}

export { setupBucketPolicies };
