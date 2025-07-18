// Test script to simulate a Mentra glasses photo being sent to the webhook
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testMentraWebhook() {
  const testImageUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1024';
  
  console.log('🧪 Testing Mentra webhook with sample image...');
  
  try {
    const response = await fetch('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.MENTRAOS_API_KEY || 'test-key'
      },
      body: JSON.stringify({
        imageUrl: testImageUrl,
        userId: process.env.MENTRA_DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000',
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Webhook response:', data);
    console.log('🎉 Test successful! Check your chat interface for the new photo.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMentraWebhook();
