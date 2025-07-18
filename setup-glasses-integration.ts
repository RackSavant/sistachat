#!/usr/bin/env ts-node

/**
 * Setup script for AI Fashion Sister Mentra Glasses Integration
 * This script helps configure and test the integration
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuration validation
const requiredEnvVars = [
  'PACKAGE_NAME',
  'MENTRAOS_API_KEY', 
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'VAPI_API_KEY',
  'VAPI_ASSISTANT_ID'
];

function validateEnvironment(): boolean {
  console.log('🔍 Validating environment configuration...');
  
  const envFile = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envFile)) {
    console.error('❌ .env.local file not found!');
    return false;
  }

  const missingVars: string[] = [];
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    return false;
  }

  console.log('✅ Environment configuration valid!');
  return true;
}

async function testSupabaseConnection(): Promise<boolean> {
  console.log('🗄️ Testing Supabase connection...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test basic connection
    const { data, error } = await supabase.from('mentra_interactions').select('count');
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

async function testOpenAIConnection(): Promise<boolean> {
  console.log('🤖 Testing OpenAI API connection...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('❌ OpenAI API connection failed:', response.status);
      return false;
    }

    console.log('✅ OpenAI API connection successful!');
    return true;
  } catch (error) {
    console.error('❌ OpenAI API connection error:', error);
    return false;
  }
}

function showConfiguration() {
  console.log('\n📋 Current Configuration:');
  console.log(`   Package Name: ${process.env.PACKAGE_NAME}`);
  console.log(`   Mentra API Key: ${process.env.MENTRAOS_API_KEY?.substring(0, 8)}...`);
  console.log(`   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`   OpenAI API Key: ${process.env.OPENAI_API_KEY?.substring(0, 8)}...`);
  console.log(`   Phone Number: ${process.env.MENTRA_CALLBACK_NUMBER}`);
}

function showUsageInstructions() {
  console.log('\n🚀 How to start the glasses integration:');
  console.log('\n1. **Start the Mentra server:**');
  console.log('   npx ts-node mentra-glasses-integration.ts');
  console.log('\n2. **Expose with ngrok:**');
  console.log('   ngrok http 3000');
  console.log('\n3. **Update your Mentra app:**');
  console.log('   - Go to https://console.mentra.glass');
  console.log(`   - Find your app: ${process.env.PACKAGE_NAME}`);
  console.log('   - Update the Public URL to your ngrok URL');
  console.log('\n4. **Test on your glasses:**');
  console.log('   - Launch your app on Mentra glasses');
  console.log('   - Press button to take photo');
  console.log('   - Listen for AI fashion advice through glasses speakers!');
  console.log('\n💡 **Integration Flow:**');
  console.log('   📸 Glasses photo → ☁️ Supabase storage → 🤖 AI analysis → 🔊 TTS → 🎧 Glasses audio');
}

async function main() {
  console.log('🔥 AI Fashion Sister Mentra Glasses Integration Setup\n');

  // Load environment
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });

  showConfiguration();

  // Validate setup
  if (!validateEnvironment()) {
    process.exit(1);
  }

  // Test connections
  const supabaseOk = await testSupabaseConnection();
  const openaiOk = await testOpenAIConnection();

  if (!supabaseOk || !openaiOk) {
    console.log('\n❌ Some connections failed. Please check your configuration.');
    process.exit(1);
  }

  console.log('\n🎉 All systems ready! Your AI Fashion Sister integration is configured correctly.');
  
  showUsageInstructions();
}

if (require.main === module) {
  main().catch(console.error);
} 