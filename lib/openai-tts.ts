import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface TTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0
  format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
}

export async function generateSpeech(
  text: string, 
  options: TTSOptions = {}
): Promise<Buffer> {
  const {
    voice = 'nova', // Friendly female voice for fashion advice
    speed = 1.1, // Slightly faster for more energy
    format = 'mp3'
  } = options;

  console.log('🔊 Generating speech with OpenAI TTS:', {
    textLength: text.length,
    voice,
    speed,
    format
  });

  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd', // Higher quality for better glasses speakers
      voice,
      input: text,
      speed,
      response_format: format,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    console.log('✅ Speech generated successfully:', {
      bufferSize: buffer.length,
      sizeKB: Math.round(buffer.length / 1024)
    });

    return buffer;
  } catch (error) {
    console.error('❌ TTS generation failed:', error);
    throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateFashionAdviceSpeech(
  advice: string,
  userName?: string
): Promise<Buffer> {
  // Add some personality to the response for glasses delivery
  const personalizedAdvice = userName 
    ? `Hey ${userName}! ${advice}` 
    : `Hey gorgeous! ${advice}`;

  return generateSpeech(personalizedAdvice, {
    voice: 'nova', // Warm, friendly voice
    speed: 1.0, // Normal speed for clarity through glasses
    format: 'mp3'
  });
} 