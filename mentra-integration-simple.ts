import { AppServer, AppSession, ViewType, AuthenticatedRequest, PhotoData } from '@mentra/sdk';
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

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
}

const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => { throw new Error('PACKAGE_NAME is not set in .env file'); })();
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY ?? (() => { throw new Error('MENTRAOS_API_KEY is not set in .env file'); })();
const PORT = parseInt(process.env.PORT || '3000');

// Supabase configuration (using existing setup)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Simple AI Fashion Sister Mentra App
 * Takes photos and triggers VAPI without database dependencies
 */
class SimpleAIFashionSisterMentraApp extends AppServer {
  private photos: Map<string, StoredPhoto> = new Map();
  private isStreamingPhotos: Map<string, boolean> = new Map();
  private nextPhotoTime: Map<string, number> = new Map();

  constructor() {
    super({
      packageName: PACKAGE_NAME,
      apiKey: MENTRAOS_API_KEY,
      port: PORT,
    });
  }

  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    console.log(`🔵 AI Fashion Sister session started for user ${userId}`);

    // Initialize user state
    this.isStreamingPhotos.set(userId, false);
    this.nextPhotoTime.set(userId, Date.now());

    // Show welcome message
    session.layouts.showTextWall("👗 AI Fashion Sister Ready!\nPress button to get outfit feedback from your personal stylist!", {durationMs: 4000});

    // Handle button presses
    session.events.onButtonPress(async (button) => {
      console.log(`Button pressed: ${button.buttonId}, type: ${button.pressType}`);

      if (button.pressType === 'long') {
        // Toggle streaming mode
        this.isStreamingPhotos.set(userId, !this.isStreamingPhotos.get(userId));
        const isStreaming = this.isStreamingPhotos.get(userId);
        console.log(`📸 Streaming mode for user ${userId}: ${isStreaming}`);
        
        session.layouts.showTextWall(
          isStreaming ? 
            "🔥 Streaming mode ON!\nI'll analyze your outfits continuously" : 
            "📸 Single photo mode\nPress button for outfit feedback",
          {durationMs: 3000}
        );
      } else {
        // Take single photo
        session.layouts.showTextWall("📸 Taking photo for your AI Fashion Sister...", {durationMs: 2000});
        
        try {
          const photo = await session.camera.requestPhoto();
          console.log(`📷 Photo taken for user ${userId}`);
          await this.processPhoto(photo, userId, session);
        } catch (error) {
          console.error(`❌ Error taking photo:`, error);
          session.layouts.showTextWall("❌ Error taking photo. Try again!", {durationMs: 3000});
        }
      }
    });

    // Streaming photo loop
    setInterval(async () => {
      if (this.isStreamingPhotos.get(userId) && Date.now() > (this.nextPhotoTime.get(userId) ?? 0)) {
        try {
          this.nextPhotoTime.set(userId, Date.now() + 30000); // 30 second cooldown
          
          const photo = await session.camera.requestPhoto();
          this.nextPhotoTime.set(userId, Date.now());
          
          await this.processPhoto(photo, userId, session);
        } catch (error) {
          console.error(`❌ Error in streaming mode:`, error);
        }
      }
    }, 1000);
  }

  protected async onStop(sessionId: string, userId: string, reason: string): Promise<void> {
    this.isStreamingPhotos.set(userId, false);
    this.nextPhotoTime.delete(userId);
    console.log(`🔴 Session stopped for user ${userId}, reason: ${reason}`);
  }

  /**
   * Process photo: Upload to Supabase and trigger VAPI
   */
  private async processPhoto(photo: PhotoData, userId: string, session: AppSession) {
    console.log(`📱 Processing photo for user ${userId}`);
    
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
    session.layouts.showTextWall("🔥 Your AI Fashion Sister is analyzing your outfit...", {durationMs: 4000});

    try {
      // Upload to existing Supabase raw-images bucket
      const imageUrl = await this.uploadToSupabase(photo, userId);
      console.log(`☁️ Image uploaded: ${imageUrl}`);
      
      // Update cached photo with URL
      cachedPhoto.imageUrl = imageUrl;
      this.photos.set(userId, cachedPhoto);

      // Trigger VAPI call
      const vapiCallId = await this.triggerVAPICall(imageUrl, userId);
      console.log(`🤖 VAPI call triggered: ${vapiCallId}`);
      
      // Update cached photo with VAPI call ID
      cachedPhoto.vapiCallId = vapiCallId;
      this.photos.set(userId, cachedPhoto);

      // Success message
      session.layouts.showTextWall("✨ AI Fashion Sister is calling you now with outfit feedback!", {durationMs: 5000});

    } catch (error) {
      console.error(`💥 Error processing photo:`, error);
      session.layouts.showTextWall("❌ Error processing photo. Please try again!", {durationMs: 3000});
    }
  }

  /**
   * Upload photo to existing Supabase raw-images bucket
   */
  private async uploadToSupabase(photo: PhotoData, userId: string): Promise<string> {
    const fileName = `${userId}/mentra-${Date.now()}-${photo.filename}`;
    
    const { data, error } = await supabase.storage
      .from('raw-images') // Using existing bucket
      .upload(fileName, photo.buffer, {
        contentType: photo.mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('raw-images')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Trigger VAPI call with image
   */
  private async triggerVAPICall(imageUrl: string, userId: string): Promise<string> {
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: VAPI_ASSISTANT_ID,
        customer: {
          number: process.env.MENTRA_CALLBACK_NUMBER || '+1234567890' // Configure your phone number
        },
        assistantOverrides: {
          variableValues: {
            imageUrl: imageUrl,
            context: 'Photo taken with Mentra OS smart glasses - give immediate styling feedback!',
            userId: userId
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VAPI call failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.id;
  }
}

// Start the simple AI Fashion Sister Mentra App
const app = new SimpleAIFashionSisterMentraApp();
app.start().catch(console.error);

export { SimpleAIFashionSisterMentraApp }; 