import { AppServer, AppSession, ViewType, AuthenticatedRequest, PhotoData } from '@mentra/sdk';
import { Request, Response } from 'express';
import * as ejs from 'ejs';
import * as path from 'path';
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
  aiResponse?: string;
  vapiCallId?: string;
}

const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => { throw new Error('PACKAGE_NAME is not set in .env file'); })();
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY ?? (() => { throw new Error('MENTRAOS_API_KEY is not set in .env file'); })();
const PORT = parseInt(process.env.PORT || '3000');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID!;

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * AI Fashion Sister Mentra App
 * Extends AppServer to provide photo taking and AI fashion feedback capabilities
 */
class AIFashionSisterMentraApp extends AppServer {
  private photos: Map<string, StoredPhoto> = new Map(); // Store photos by userId
  private latestPhotoTimestamp: Map<string, number> = new Map(); // Track latest photo timestamp per user
  private isStreamingPhotos: Map<string, boolean> = new Map(); // Track if we are streaming photos for a user
  private nextPhotoTime: Map<string, number> = new Map(); // Track next photo time for a user

  constructor() {
    super({
      packageName: PACKAGE_NAME,
      apiKey: MENTRAOS_API_KEY,
      port: PORT,
    });
    this.setupWebviewRoutes();
  }

  /**
   * Handle new session creation and button press events
   */
  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    // this gets called whenever a user launches the app
    this.logger.info(`🔵 AI Fashion Sister session started for user ${userId}`);

    // set the initial state of the user
    this.isStreamingPhotos.set(userId, false);
    this.nextPhotoTime.set(userId, Date.now());

    // Show welcome message
    session.layouts.showTextWall("👗 AI Fashion Sister Ready! Press button to get outfit feedback", {durationMs: 3000});

    // this gets called whenever a user presses a button
    session.events.onButtonPress(async (button) => {
      this.logger.info(`Button pressed: ${button.buttonId}, type: ${button.pressType}`);

      if (button.pressType === 'long') {
        // the user held the button, so we toggle the streaming mode
        this.isStreamingPhotos.set(userId, !this.isStreamingPhotos.get(userId));
        const isStreaming = this.isStreamingPhotos.get(userId);
        this.logger.info(`📸 Streaming photos for user ${userId} is now ${isStreaming}`);
        
        session.layouts.showTextWall(
          isStreaming ? "🔥 Streaming mode ON! I'll analyze your outfits continuously" : "📸 Single photo mode. Press button for outfit feedback",
          {durationMs: 3000}
        );
        return;
      } else {
        session.layouts.showTextWall("📸 Taking photo for AI Fashion Sister...", {durationMs: 2000});
        // the user pressed the button, so we take a single photo
        try {
          // first, get the photo
          const photo = await session.camera.requestPhoto();
          // if there was an error, log it
          this.logger.info(`📷 Photo taken for user ${userId}, timestamp: ${photo.timestamp}`);
          await this.cachePhotoAndAnalyze(photo, userId, session);
        } catch (error) {
          this.logger.error(`❌ Error taking photo: ${error}`);
          session.layouts.showTextWall("❌ Error taking photo. Try again!", {durationMs: 3000});
        }
      }
    });

    // repeatedly check if we are in streaming mode and if we are ready to take another photo
    setInterval(async () => {
      if (this.isStreamingPhotos.get(userId) && Date.now() > (this.nextPhotoTime.get(userId) ?? 0)) {
        try {
          // set the next photos for 30 seconds from now, as a fallback if this fails
          this.nextPhotoTime.set(userId, Date.now() + 30000);

          // actually take the photo
          const photo = await session.camera.requestPhoto();

          // set the next photo time to now, since we are ready to take another photo
          this.nextPhotoTime.set(userId, Date.now());

          // cache the photo and analyze with AI Fashion Sister
          await this.cachePhotoAndAnalyze(photo, userId, session);
        } catch (error) {
          this.logger.error(`❌ Error auto-taking photo: ${error}`);
        }
      }
    }, 1000);
  }

  protected async onStop(sessionId: string, userId: string, reason: string): Promise<void> {
    // clean up the user's state
    this.isStreamingPhotos.set(userId, false);
    this.nextPhotoTime.delete(userId);
    this.logger.info(`🔴 Session stopped for user ${userId}, reason: ${reason}`);
  }

  /**
   * Cache a photo and send it to AI Fashion Sister for analysis
   */
  private async cachePhotoAndAnalyze(photo: PhotoData, userId: string, session: AppSession) {
    // create a new stored photo object which includes the photo data and the user id
    const cachedPhoto: StoredPhoto = {
      requestId: photo.requestId,
      buffer: photo.buffer,
      timestamp: photo.timestamp,
      userId: userId,
      mimeType: photo.mimeType,
      filename: photo.filename,
      size: photo.size
    };

    // cache the photo for display
    this.photos.set(userId, cachedPhoto);
    // update the latest photo timestamp
    this.latestPhotoTimestamp.set(userId, cachedPhoto.timestamp.getTime());
    this.logger.info(`📱 Photo cached for user ${userId}, timestamp: ${cachedPhoto.timestamp}`);

    // Show processing message
    session.layouts.showTextWall("🔥 Your AI Fashion Sister is analyzing your outfit...", {durationMs: 4000});

    try {
      // Upload image to Supabase
      const imageUrl = await this.uploadImageToSupabase(photo, userId);
      this.logger.info(`☁️ Image uploaded to Supabase: ${imageUrl}`);

      // Trigger VAPI assistant with the image
      const vapiCallId = await this.triggerVAPIAssistant(imageUrl, userId);
      this.logger.info(`🤖 VAPI assistant triggered with call ID: ${vapiCallId}`);

      // Update cached photo with VAPI call ID
      cachedPhoto.vapiCallId = vapiCallId;
      this.photos.set(userId, cachedPhoto);

      // Store the interaction in database
      await this.storeInteraction(userId, imageUrl, vapiCallId);

      // Show success message
      session.layouts.showTextWall("✨ AI Fashion Sister is giving you feedback now! Check your phone for voice response.", {durationMs: 5000});

    } catch (error) {
      this.logger.error(`💥 Error processing photo: ${error}`);
      session.layouts.showTextWall("❌ Error processing photo. Please try again!", {durationMs: 3000});
    }
  }

  /**
   * Upload image to Supabase storage
   */
  private async uploadImageToSupabase(photo: PhotoData, userId: string): Promise<string> {
    const fileName = `${userId}/mentra-${Date.now()}-${photo.filename}`;
    
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

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('raw-images')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Trigger VAPI assistant with image
   */
  private async triggerVAPIAssistant(imageUrl: string, userId: string): Promise<string> {
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: VAPI_ASSISTANT_ID,
        customer: {
          number: '+1234567890' // You'll need to configure this per user
        },
        assistantOverrides: {
          variableValues: {
            imageUrl: imageUrl,
            context: 'Photo taken with Mentra OS smart glasses',
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

  /**
   * Store interaction in database
   */
  private async storeInteraction(userId: string, imageUrl: string, vapiCallId: string): Promise<void> {
    const { error } = await supabase
      .from('mentra_interactions')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        vapi_call_id: vapiCallId,
        mentra_package_name: PACKAGE_NAME,
        status: 'processing'
      });

    if (error) {
      this.logger.error(`⚠️ Failed to store interaction: ${error.message}`);
    }
  }

  /**
   * Set up webview routes for photo display functionality
   */
  private setupWebviewRoutes(): void {
    const app = this.getExpressApp();

    // API endpoint to get the latest photo for the authenticated user
    app.get('/api/latest-photo', (req: any, res: any) => {
      const userId = (req as AuthenticatedRequest).authUserId;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const photo = this.photos.get(userId);
      if (!photo) {
        res.status(404).json({ error: 'No photo available' });
        return;
      }

      res.json({
        requestId: photo.requestId,
        timestamp: photo.timestamp.getTime(),
        hasPhoto: true,
        vapiCallId: photo.vapiCallId,
        aiResponse: photo.aiResponse
      });
    });

    // API endpoint to get photo data
    app.get('/api/photo/:requestId', (req: any, res: any) => {
      const userId = (req as AuthenticatedRequest).authUserId;
      const requestId = req.params.requestId;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const photo = this.photos.get(userId);
      if (!photo || photo.requestId !== requestId) {
        res.status(404).json({ error: 'Photo not found' });
        return;
      }

      res.set({
        'Content-Type': photo.mimeType,
        'Cache-Control': 'no-cache'
      });
      res.send(photo.buffer);
    });

    // Main webview route - displays the AI Fashion Sister interface
    app.get('/webview', async (req: any, res: any) => {
      const userId = (req as AuthenticatedRequest).authUserId;

      if (!userId) {
        res.status(401).send(`
          <html>
            <head><title>AI Fashion Sister - Not Authenticated</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>👗 Please open this page from the MentraOS app</h1>
            </body>
          </html>
        `);
        return;
      }

      // You can customize this to show AI Fashion Sister interface
      const templatePath = path.join(process.cwd(), 'views', 'fashion-sister-viewer.ejs');
      const html = await ejs.renderFile(templatePath, {
        userId: userId,
        appName: 'AI Fashion Sister'
      });
      res.send(html);
    });
  }
}

// Start the AI Fashion Sister Mentra App
const app = new AIFashionSisterMentraApp();
app.start().catch(console.error);

export { AIFashionSisterMentraApp }; 