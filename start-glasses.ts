import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { generateFashionAdviceSpeech } from './lib/openai-tts.js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test endpoint to verify everything works
app.get('/test', (req, res) => {
  res.json({
    message: '🔥 AI Fashion Sister Glasses Integration Ready!',
    config: {
      packageName: process.env.PACKAGE_NAME,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasMentra: !!process.env.MENTRAOS_API_KEY
    }
  });
});

// Mentra webhook endpoint - receives photos from glasses
app.post('/mentra-photo', async (req, res) => {
  console.log('📸 Received photo from Mentra glasses!', req.body);
  
  try {
    // This is where we'll process the photo
    // For now, let's just test the TTS
    const testAdvice = "Hey gorgeous! You're looking absolutely stunning today! That outfit is giving me major main character energy!";
    
    console.log('🔊 Generating speech...');
    const audioBuffer = await generateFashionAdviceSpeech(testAdvice);
    
    console.log('✅ Speech generated successfully!', audioBuffer.length, 'bytes');
    
    res.json({
      success: true,
      message: 'Photo processed and speech generated!',
      audioSize: audioBuffer.length
    });
    
  } catch (error) {
    console.error('❌ Error processing photo:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AI Fashion Sister Glasses Server running on port ${PORT}`);
  console.log(`📱 Package: ${process.env.PACKAGE_NAME}`);
  console.log(`🔗 Test at: http://localhost:${PORT}/test`);
  console.log(`📸 Ready for Mentra glasses at: http://localhost:${PORT}/mentra-photo`);
}); 