import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const app = express();
const PORT = 3002; // Using a different port to avoid conflicts

app.use(express.json());

// Environment variables for VAPI
const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID!;

// Test VAPI assistant query with an image
async function testVAPIAssistant(imageUrl: string): Promise<{success: boolean, response?: string, error?: string}> {
  try {
    console.log(`🔮 Testing VAPI assistant query with image: ${imageUrl}`);
    
    const response = await fetch('https://api.vapi.ai/assistant/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: VAPI_ASSISTANT_ID,
        inputs: [
          {
            name: 'imageUrl',
            value: imageUrl
          },
          {
            name: 'context',
            value: 'Photo taken with Mentra OS smart glasses - give immediate styling feedback!'
          }
        ],
        responseFormat: 'text'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ VAPI API error: ${response.status} ${errorText}`);
      return { 
        success: false, 
        error: `VAPI API error: ${response.status} ${errorText}`
      };
    }

    const data = await response.json();
    console.log('✅ VAPI response received:', {
      hasResponse: !!data.response,
      responseLength: data.response?.length || 0,
      responsePreview: data.response?.substring(0, 100) + '...'
    });
    
    return { 
      success: true, 
      response: data.response || 'No response from VAPI'
    };
  } catch (error) {
    console.error('❌ Error using VAPI for fashion advice:', error);
    return { 
      success: false, 
      error: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Fallback to OpenAI for testing
async function testOpenAIFashionAdvice(imageUrl: string): Promise<{success: boolean, response?: string, error?: string}> {
  try {
    console.log('⚠️ Testing OpenAI fallback for fashion advice');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a fun, energetic AI fashion sister giving styling advice through smart glasses. 
            Be encouraging, specific, and conversational. Keep responses under 100 words since they'll be spoken aloud.
            Use casual language like "girl", "babe", "gorgeous" and give actionable styling tips.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'What do you think of this outfit? Give me styling feedback!'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      return { 
        success: false, 
        error: `OpenAI API error: ${response.status}`
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      response: data.choices[0].message.content || 'You look amazing, babe! Keep being fabulous!'
    };
  } catch (error) {
    console.error('❌ Error using OpenAI for fashion advice:', error);
    return { 
      success: false, 
      error: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Test endpoint to verify VAPI configuration
app.get('/test-vapi', async (req, res) => {
  console.log('🧪 Running VAPI integration test...');
  
  const results = {
    message: '🔥 VAPI Integration Test!',
    config: {
      hasVAPI: !!VAPI_API_KEY && !!VAPI_ASSISTANT_ID,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      vapiKey: VAPI_API_KEY ? `${VAPI_API_KEY.substring(0, 4)}...` : 'Missing',
      vapiAssistantId: VAPI_ASSISTANT_ID ? `${VAPI_ASSISTANT_ID.substring(0, 4)}...` : 'Missing',
    },
    tests: {} as any
  };

  res.json(results);
});

// Test endpoint with a sample image
app.get('/test-image', async (req, res) => {
  // Sample fashion image URL - replace with your own test image
  const sampleImageUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=720&q=80';
  
  console.log('🧪 Testing VAPI with sample image...');
  
  // Test VAPI first
  const vapiResult = await testVAPIAssistant(sampleImageUrl);
  
  // If VAPI fails, test OpenAI as fallback
  let openaiResult = { success: false, tested: false };
  if (!vapiResult.success) {
    console.log('⚠️ VAPI failed, testing OpenAI fallback...');
    const result = await testOpenAIFashionAdvice(sampleImageUrl);
    openaiResult = { ...result, tested: true };
  }
  
  res.json({
    message: '🔥 VAPI Image Test Results',
    vapi: vapiResult,
    openai: openaiResult,
    imageUrl: sampleImageUrl
  });
});

// Mentra webhook simulation endpoint
app.post('/simulate-mentra-webhook', async (req, res) => {
  console.log('📸 Simulating Mentra webhook with image...');
  
  // Get image URL from request or use default
  const imageUrl = req.body.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=720&q=80';
  const userId = req.body.userId || 'test-user-123';
  
  try {
    // Test VAPI first
    const vapiResult = await testVAPIAssistant(imageUrl);
    
    // If VAPI fails, test OpenAI as fallback
    if (!vapiResult.success) {
      console.log('⚠️ VAPI failed, using OpenAI fallback...');
      const openaiResult = await testOpenAIFashionAdvice(imageUrl);
      
      if (!openaiResult.success) {
        throw new Error('Both VAPI and OpenAI failed');
      }
      
      res.json({
        success: true,
        source: 'openai',
        advice: openaiResult.response,
        imageUrl,
        userId,
        photoId: uuidv4()
      });
      return;
    }
    
    res.json({
      success: true,
      source: 'vapi',
      advice: vapiResult.response,
      imageUrl,
      userId,
      photoId: uuidv4()
    });
    
  } catch (error) {
    console.error('❌ Error processing webhook simulation:', error);
    res.status(500).json({ 
      error: 'Processing failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 VAPI Integration Test Server running on port ${PORT}`);
  console.log(`📱 VAPI Assistant ID: ${VAPI_ASSISTANT_ID ? `${VAPI_ASSISTANT_ID.substring(0, 4)}...` : 'Missing'}`);
  console.log(`🔗 Test VAPI config: http://localhost:${PORT}/test-vapi`);
  console.log(`🖼️ Test with sample image: http://localhost:${PORT}/test-image`);
  console.log(`📸 Simulate Mentra webhook: POST to http://localhost:${PORT}/simulate-mentra-webhook`);
  console.log(`\n🎯 Next steps:`);
  console.log(`1. Test VAPI config: curl http://localhost:${PORT}/test-vapi`);
  console.log(`2. Test with sample image: curl http://localhost:${PORT}/test-image`);
  console.log(`3. Simulate webhook: curl -X POST http://localhost:${PORT}/simulate-mentra-webhook -H "Content-Type: application/json" -d '{"imageUrl":"https://example.com/image.jpg"}'`);
});
