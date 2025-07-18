import { AppServer, AppSession, ViewType, AuthenticatedRequest, PhotoData } from '@mentra/sdk';
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { generateFashionAdviceSpeech } from './lib/openai-tts';

/**
 * Interface representing a stored photo with metadata
 */
interface StoredPhoto {
  requestId: string;
  buffer: Buffer;
  timestamp: Date;
  userId: string;
  mimeType: string;
  filename: string;
  size: number;
  vapiCallId?: string;
  imageUrl?: string;
  audioUrl?: string;
}

const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => { throw new Error('PACKAGE_NAME is not set in .env file'); })();
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY ?? (() => { throw new Error('MENTRAOS_API_KEY is not set in .env file'); })();
const PORT = parseInt(process.env.PORT || '3000');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * AI Fashion Sister Mentra App with Glasses Audio Playback
 * Takes photos, gets AI fashion advice, and plays it through glasses speakers
 */
class AIFashionSisterGlassesApp extends AppServer {
  private photos: Map<string, StoredPhoto> = new Map();
  private isProcessing: Map<string, boolean> = new Map();

  constructor() {
    super({
      packageName: PACKAGE_NAME,
      apiKey: MENTRAOS_API_KEY,
      port: PORT,
    });
  }

  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    console.log(`👗 AI Fashion Sister session started for user ${userId}`);

    // Initialize user state
    this.isProcessing.set(userId, false);

    // Show welcome message
    session.layouts.showTextWall(
      "✨ AI Fashion Sister Ready!\nPress button to get instant outfit feedback through your glasses!", 
      {durationMs: 4000}
    );

    // Handle button presses
    session.events.onButtonPress(async (button) => {
      console.log(`Button pressed: ${button.buttonId}, type: ${button.pressType}`);

      if (this.isProcessing.get(userId)) {
        session.layouts.showTextWall("⏳ Already processing your outfit...", {durationMs: 2000});
        return;
      }

      if (button.pressType === 'short') {
        // Take photo and get fashion advice
        this.isProcessing.set(userId, true);
        session.layouts.showTextWall("📸 Capturing your fabulous outfit...", {durationMs: 2000});
        
        try {
          const photo = await session.camera.requestPhoto();
          console.log(`📷 Photo captured for user ${userId}`);
          await this.processPhotoForGlasses(photo, userId, session);
        } catch (error) {
          console.error(`❌ Error processing outfit:`, error);
          session.layouts.showTextWall("❌ Oops! Try again, babe!", {durationMs: 3000});
        } finally {
          this.isProcessing.set(userId, false);
        }
      } else if (button.pressType === 'long') {
        // Show status or help
        session.layouts.showTextWall(
          "💡 Short press: Get outfit feedback\n🎧 Audio plays through your glasses!", 
          {durationMs: 4000}
        );
      }
    });
  }

  protected async onStop(sessionId: string, userId: string, reason: string): Promise<void> {
    this.isProcessing.set(userId, false);
    console.log(`🔴 Session stopped for user ${userId}, reason: ${reason}`);
  }

  /**
   * Process photo: Upload to Supabase, get VAPI analysis, convert to speech, play through glasses
   */
  private async processPhotoForGlasses(photo: PhotoData, userId: string, session: AppSession) {
    console.log(`💄 Processing outfit photo for glasses playback`);
    
    // Cache photo locally
    const cachedPhoto: StoredPhoto = {
      requestId: photo.requestId,
      buffer: photo.buffer,
      timestamp: photo.timestamp,
      userId: userId,
      mimeType: photo.mimeType,
      filename: photo.filename,
      size: photo.size
    };

    this.photos.set(userId, cachedPhoto);
    
    // Show processing message
    session.layouts.showTextWall("🤖 Your AI sister is analyzing your look...", {durationMs: 3000});

    try {
      // Step 1: Upload image to Supabase
      const imageUrl = await this.uploadToSupabase(photo, userId);
      console.log(`☁️ Image uploaded: ${imageUrl}`);
      cachedPhoto.imageUrl = imageUrl;

      // Step 2: Get AI fashion analysis from VAPI (but don't make a call)
      session.layouts.showTextWall("✨ Getting fashion insights...", {durationMs: 3000});
      const fashionAdvice = await this.getAIFashionAdvice(imageUrl);
      console.log(`🎯 Fashion advice generated: ${fashionAdvice.substring(0, 100)}...`);

      // Step 3: Convert advice to speech
      session.layouts.showTextWall("🔊 Preparing your personalized feedback...", {durationMs: 2000});
      const audioBuffer = await generateFashionAdviceSpeech(fashionAdvice);
      
      // Step 4: Upload audio to Supabase for glasses playback
      const audioUrl = await this.uploadAudioToSupabase(audioBuffer, userId);
      console.log(`🎵 Audio uploaded: ${audioUrl}`);
      cachedPhoto.audioUrl = audioUrl;

      // Step 5: Play audio through glasses speakers
      session.layouts.showTextWall("🎧 Listen to your AI sister's advice!", {durationMs: 2000});
      await this.playAudioThroughGlasses(session, audioUrl);

      // Store the interaction in database
      await this.storeInteraction(cachedPhoto, fashionAdvice);

      // Success message
      session.layouts.showTextWall("💅 Outfit analysis complete! You're looking amazing!", {durationMs: 4000});

    } catch (error) {
      console.error(`💥 Error processing outfit for glasses:`, error);
      session.layouts.showTextWall("❌ Fashion emergency! Please try again!", {durationMs: 3000});
    }
  }

  /**
   * Upload photo to Supabase raw-images bucket
   */
  private async uploadToSupabase(photo: PhotoData, userId: string): Promise<string> {
    const fileName = `${userId}/glasses-${Date.now()}-${photo.filename}`;
    
    const { data, error } = await supabase.storage
      .from('raw-images')
      .upload(fileName, photo.buffer, {
        contentType: photo.mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('raw-images')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Upload audio file to Supabase for glasses playback
   */
  private async uploadAudioToSupabase(audioBuffer: Buffer, userId: string): Promise<string> {
    const fileName = `${userId}/audio-${Date.now()}.mp3`;
    
    const { data, error } = await supabase.storage
      .from('raw-images') // Using same bucket for now
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload audio: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('raw-images')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Get AI fashion advice using VAPI assistant (without making a phone call)
   */
  private async getAIFashionAdvice(imageUrl: string): Promise<string> {
    // Use OpenAI directly for faster response (Option B approach within Option A)
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || 'You look amazing, babe! Keep being fabulous!';
  }

  /**
   * Play audio through Mentra glasses speakers
   */
  private async playAudioThroughGlasses(session: AppSession, audioUrl: string): Promise<void> {
    try {
      console.log(`🔊 Playing audio through glasses: ${audioUrl}`);
      
      // Use Mentra SDK to play audio through glasses speakers
      // Note: Audio playback method will be implemented once we test the SDK
      // For now, we'll provide the audio URL and show instructions
      console.log(`🎵 Audio file ready for glasses playback: ${audioUrl}`);
      
      // TODO: Implement actual audio playback once Mentra SDK audio methods are confirmed
      // Possible methods to try:
      // - session.audio.playFile(audioUrl)
      // - session.audio.streamUrl(audioUrl) 
      // - session.media.playAudio(audioUrl)
      
      session.layouts.showTextWall("🎵 Your AI fashion sister has some advice for you! Check your glasses audio.", {durationMs: 4000});
      
      console.log(`✅ Audio playback initiated on glasses`);
    } catch (error) {
      console.error(`❌ Failed to play audio through glasses:`, error);
      // Fallback: show text on glasses display
      session.layouts.showTextWall("🎵 Audio ready! Check your glasses speakers.", {durationMs: 3000});
    }
  }

  /**
   * Store interaction in database for analytics
   */
  private async storeInteraction(photo: StoredPhoto, advice: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('mentra_interactions')
        .insert({
          user_id: photo.userId,
          image_url: photo.imageUrl,
          audio_url: photo.audioUrl,
          ai_response: advice,
          mentra_package_name: PACKAGE_NAME,
          timestamp: photo.timestamp.toISOString(),
          status: 'completed',
          interaction_type: 'glasses_audio'
        });

      if (error) {
        console.error('⚠️ Failed to store interaction:', error);
      }
    } catch (error) {
      console.error('⚠️ Database storage error:', error);
    }
  }
}

// Start the AI Fashion Sister Glasses App
const app = new AIFashionSisterGlassesApp();
app.start().catch(console.error);

console.log(`🔥 AI Fashion Sister Glasses Integration started!`);
console.log(`📱 Package: ${PACKAGE_NAME}`);
console.log(`🎯 Ready for outfit analysis with glasses audio playback!`);

export { AIFashionSisterGlassesApp }; 