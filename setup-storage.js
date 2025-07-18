// Script to set up Supabase storage buckets with environment variables from .env.local
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env.local');
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  
  // Set environment variables
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }
  
  console.log('Environment variables loaded successfully');
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing'}`);
  
  // Run the bucket creation script
  try {
    console.log('\nRunning bucket creation script...');
    execSync('npx tsx utils/supabase/create-buckets.ts', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running bucket creation script:', error.message);
  }
} else {
  console.error('Error: .env.local file not found');
}
