import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

/**
 * Debug authentication and storage policies
 * Run with: npx tsx utils/supabase/debug-auth-and-policies.ts
 */

async function debugAuthAndPolicies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  console.log('🔍 Debugging Supabase Authentication and Storage Policies...\n');

  // Create service role client (bypasses RLS)
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  
  // Create anon client (subject to RLS)
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Check current storage policies
    console.log('📋 Checking current storage policies...');
    const { data: policies, error: policiesError } = await serviceClient
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage');

    if (policiesError) {
      console.error('❌ Error fetching policies:', policiesError);
    } else {
      console.log('✅ Current storage policies:');
      policies?.forEach(policy => {
        if (policy.policyname.includes('raw_images') || policy.policyname.includes('sistachat')) {
          console.log(`   - ${policy.policyname} (${policy.cmd})`);
          console.log(`     Definition: ${policy.definition || policy.qual}`);
        }
      });
    }

    console.log('\n🧪 Testing storage access...');

    // 2. Test bucket access with service role (should work)
    console.log('📦 Testing bucket access with service role...');
    const { data: bucketFiles, error: bucketError } = await serviceClient.storage
      .from('raw-images')
      .list('sistachat', { limit: 5 });

    if (bucketError) {
      console.error('❌ Service role bucket access failed:', bucketError);
    } else {
      console.log('✅ Service role can access bucket');
      console.log(`   Found ${bucketFiles?.length || 0} items in sistachat folder`);
    }

    // 3. Test upload with service role
    console.log('\n📤 Testing upload with service role...');
    const testContent = new Blob(['test-service'], { type: 'text/plain' });
    const testFile = new File([testContent], 'test-service.txt', { type: 'text/plain' });
    const testPath = `sistachat/test-user-id/${Date.now()}-test-service.txt`;

    const { data: serviceUpload, error: serviceUploadError } = await serviceClient.storage
      .from('raw-images')
      .upload(testPath, testFile);

    if (serviceUploadError) {
      console.error('❌ Service role upload failed:', serviceUploadError);
    } else {
      console.log('✅ Service role upload successful');
      // Clean up
      await serviceClient.storage.from('raw-images').remove([testPath]);
    }

    // 4. Test with anon client (this should fail due to RLS)
    console.log('\n🔒 Testing with anonymous client (should fail due to RLS)...');
    const { data: anonUpload, error: anonUploadError } = await anonClient.storage
      .from('raw-images')
      .upload(`sistachat/anon-test/${Date.now()}-test.txt`, testFile);

    if (anonUploadError) {
      console.log('✅ Anonymous upload correctly blocked:', anonUploadError.message);
    } else {
      console.warn('⚠️ Anonymous upload succeeded (this might be unexpected)');
      // Clean up
      await anonClient.storage.from('raw-images').remove([`sistachat/anon-test/${Date.now()}-test.txt`]);
    }

    // 5. Check if we can simulate an authenticated user context
    console.log('\n👤 Checking authentication context...');
    
    // Try to get user with anon client (should return null)
    const { data: { user: anonUser }, error: anonAuthError } = await anonClient.auth.getUser();
    console.log('Anonymous client user:', anonUser ? 'Authenticated' : 'Not authenticated');

    console.log('\n💡 Recommendations:');
    console.log('1. Make sure you are logged in to your app');
    console.log('2. Check that the client-side Supabase client has the user session');
    console.log('3. Verify the RLS policies are correctly extracting the user ID from the path');
    console.log('4. Consider temporarily adding a public upload policy for testing');

  } catch (error) {
    console.error('💥 Debug script error:', error);
  }
}

// Run the debug script
if (require.main === module) {
  debugAuthAndPolicies().catch(console.error);
}

export { debugAuthAndPolicies };
