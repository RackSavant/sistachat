import express from 'express';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(express.json());

// Simple TTS test function using OpenAI
async function testTTS(text: string): Promise<boolean> {
  try {
    console.log('🔊 Testing TTS with OpenAI...');
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',
        input: text,
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      console.error('❌ TTS failed:', response.status);
      return false;
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('✅ TTS success! Generated', audioBuffer.byteLength, 'bytes of audio');
    return true;
  } catch (error) {
    console.error('❌ TTS error:', error);
    return false;
  }
}

// Test endpoint to verify everything works
app.get('/test', async (req, res) => {
  console.log('🧪 Running comprehensive test...');
  
  const results = {
    message: '🔥 AI Fashion Sister Glasses Integration Test!',
    config: {
      packageName: process.env.PACKAGE_NAME,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasMentra: !!process.env.MENTRAOS_API_KEY,
    },
    tests: {} as any
  };

  // Test OpenAI TTS
  results.tests.tts = await testTTS("Hey gorgeous! This is a test of your AI fashion sister!");

  // Test Supabase connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase.from('mentra_interactions').select('count');
    results.tests.supabase = !error;
    console.log(results.tests.supabase ? '✅ Supabase connected' : '❌ Supabase failed:', error?.message);
  } catch (e) {
    results.tests.supabase = false;
    console.log('❌ Supabase error:', e);
  }

  console.log('🎯 Test results:', results.tests);
  res.json(results);
});

// Mentra webhook endpoint - receives photos from glasses
app.post('/mentra-photo', async (req, res) => {
  console.log('📸 Received photo from Mentra glasses!');
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const testAdvice = "Hey gorgeous! You're looking absolutely stunning today! That outfit is giving me major main character energy!";
    
    console.log('🔊 Testing speech generation...');
    const ttsSuccess = await testTTS(testAdvice);
    
    res.json({
      success: true,
      message: 'Photo received and processed!',
      ttsWorked: ttsSuccess,
      advice: testAdvice
    });
    
  } catch (error) {
    console.error('❌ Error processing photo:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AI Fashion Sister Glasses Test Server running on port ${PORT}`);
  console.log(`📱 Package: ${process.env.PACKAGE_NAME}`);
  console.log(`🔗 Test at: http://localhost:${PORT}/test`);
  console.log(`📸 Ready for Mentra glasses at: http://localhost:${PORT}/mentra-photo`);
  console.log(`\n🎯 Next steps:`);
  console.log(`1. Test: curl http://localhost:${PORT}/test`);
  console.log(`2. Set up ngrok: ngrok http ${PORT}`);
  console.log(`3. Update Mentra console with ngrok URL`);
}); 