import mentraSDK from '@mentra/sdk';
const { AppServer } = mentraSDK;

import express from 'express';
type Request = express.Request;
type Response = express.Response;

import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.mentra file
dotenv.config({ path: '.env.mentra' });

// Interface for stored photo data
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

// Define PhotoData interface since it's not exported from @mentra/sdk
interface PhotoData {
  requestId: string;
  buffer: Buffer;
  timestamp: number;
  mimeType: string;
}

// Environment variables
const PACKAGE_NAME = process.env.PACKAGE_NAME || 'com.aifashionsister.mentra';
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY || '';
const PORT = parseInt(process.env.PORT || '3001');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const VAPI_API_KEY = process.env.VAPI_API_KEY || '';
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || '';
const MENTRA_DEFAULT_USER_ID = process.env.MENTRA_DEFAULT_USER_ID || 'anonymous-user';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * AI Fashion Sister Mentra App - Simplified Version
 */
class AIFashionSisterSimpleApp extends AppServer {
  private photos: Map<string, StoredPhoto> = new Map();
  private isStreamingPhotos: Map<string, boolean> = new Map();

  constructor() {
    super({
      packageName: PACKAGE_NAME,
      apiKey: MENTRAOS_API_KEY,
      port: PORT,
    });
    this.setupWebviewRoutes();
    this.logger.info('🚀 AI Fashion Sister Mentra App initialized');
  }

  /**
   * Handle session events
   */
  protected async onSession(session: any, sessionId: string, userId: string): Promise<void> {
    this.logger.info(`🔵 AI Fashion Sister session started for user ${userId}`);
    this.isStreamingPhotos.set(userId, false);

    // Show welcome message
    session.layouts.showTextWall("👗 AI Fashion Sister Ready! Press button to get outfit feedback", {durationMs: 3000});

    // Set up button press handler
    session.events.onButtonPress(async (button: any) => {
      this.logger.info(`Button pressed: ${button.buttonId}, type: ${button.pressType}`);

      if (button.pressType === 'long') {
        // Toggle streaming mode
        this.isStreamingPhotos.set(userId, !this.isStreamingPhotos.get(userId));
        const isStreaming = this.isStreamingPhotos.get(userId);
        
        session.layouts.showTextWall(
          isStreaming ? "🔥 Streaming mode ON! Analyzing outfits continuously" : "📸 Single photo mode. Press button for feedback",
          {durationMs: 3000}
        );
      } else {
        // Take a single photo
        session.layouts.showTextWall("📸 Taking photo for AI Fashion Sister...", {durationMs: 2000});
        
        try {
          const photo = await session.camera.requestPhoto();
          this.logger.info(`📷 Photo taken for user ${userId}`);
          await this.processPhoto(photo, userId, session);
        } catch (error) {
          this.logger.error(`❌ Error taking photo: ${error}`);
          session.layouts.showTextWall("❌ Error taking photo. Try again!", {durationMs: 3000});
        }
      }
    });

    // Set up webview
    const expressApp = this.getExpressApp();
    session.layouts.showTextWall("👗 Open AI Fashion Sister in your browser", {durationMs: 3000});
  }

  /**
   * Handle session stop
   */
  protected async onStop(sessionId: string, userId: string, reason: string): Promise<void> {
    this.logger.info(`Session stopped for user ${userId}, reason: ${reason}`);
    this.isStreamingPhotos.set(userId, false);
  }

  /**
   * Process photo and send to AI Fashion Sister
   */
  private async processPhoto(photo: PhotoData, userId: string, session: any): Promise<void> {
    try {
      // Store the photo
      const storedPhoto: StoredPhoto = {
        requestId: photo.requestId,
        buffer: photo.buffer,
        timestamp: new Date(photo.timestamp),
        userId: userId,
        mimeType: photo.mimeType,
        filename: `${Date.now()}_${userId}.jpg`,
        size: photo.buffer.length
      };
      
      this.photos.set(userId, storedPhoto);
      
      // Upload to Supabase
      session.layouts.showTextWall("🔄 Uploading photo to AI Fashion Sister...", {durationMs: 2000});
      const imageUrl = await this.uploadImageToSupabase(photo, userId);
      
      // Trigger VAPI assistant
      session.layouts.showTextWall("🧠 AI Fashion Sister is analyzing your outfit...", {durationMs: 2000});
      const vapiCallId = await this.triggerVAPIAssistant(imageUrl, userId);
      
      // Update stored photo with VAPI call ID
      storedPhoto.vapiCallId = vapiCallId;
      this.photos.set(userId, storedPhoto);
      
      // Show success message
      session.layouts.showTextWall("✅ AI Fashion Sister is calling you now!", {durationMs: 5000});
      
      // Store interaction in database
      await this.storeInteraction(userId, imageUrl, vapiCallId);
      
      // Show success message with instructions
      session.layouts.showTextWall("✅ AI Fashion Sister is analyzing your outfit! Check your phone for a call and visit the web app.", {durationMs: 5000});
      
    } catch (error) {
      this.logger.error(`❌ Error processing photo: ${error}`);
      session.layouts.showTextWall("❌ Error processing photo. Try again!", {durationMs: 3000});
    }
  }

  /**
   * Upload image to Supabase storage
   */
  private async uploadImageToSupabase(photo: PhotoData, userId: string): Promise<string> {
    const fileName = `mentra/${userId}/${Date.now()}.jpg`;
    
    // Upload the photo to Supabase storage
    const { error } = await supabase.storage
      .from('raw-images')
      .upload(fileName, photo.buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      this.logger.error(`❌ Error uploading to Supabase: ${error.message}`);
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('raw-images')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Trigger VAPI assistant with image
   */
  private async triggerVAPIAssistant(imageUrl: string, userId: string): Promise<string> {
    const callbackNumber = process.env.MENTRA_CALLBACK_NUMBER || '+1234567890';
    
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: VAPI_ASSISTANT_ID,
        customer: {
          number: callbackNumber
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
    try {
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
    } catch (error) {
      this.logger.error(`⚠️ Error storing interaction: ${error}`);
    }
  }

  /**
   * Set up webview routes
   */
  private setupWebviewRoutes(): void {
    const app = this.getExpressApp();
    
    // Add a simple test endpoint
    app.get('/test', (req: Request, res: Response) => {
      res.send('Mentra integration server is working!');
    });
    
    // Add common webhook endpoints
    app.post('/webhook', (req: Request, res: Response) => {
      this.logger.info('Received webhook request:', req.body);
      res.status(200).json({ status: 'success' });
    });
    
    app.get('/status', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'online',
        packageName: PACKAGE_NAME,
        timestamp: new Date().toISOString()
      });
    });

    // API endpoint to get the latest photo
    app.get('/api/latest-photo', (req: Request, res: Response) => {
      const userId = (req as any).authUserId || MENTRA_DEFAULT_USER_ID;

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
        vapiCallId: photo.vapiCallId
      });
    });

    // API endpoint to get photo data
    app.get('/api/photo/:requestId', (req: Request, res: Response) => {
      const userId = (req as any).authUserId || MENTRA_DEFAULT_USER_ID;
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
    
    // Main webview route - serve a simple HTML page with embedded chat interface
    app.get('/webview', (req: Request, res: Response) => {
      this.logger.info('Serving SistaChat webview interface');
      
      // Get the ngrok URL from the request
      const host = req.headers.host || 'localhost:3001';
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const baseUrl = `${protocol}://${host}`;
      
      // Serve a simple HTML page with instructions
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AI Fashion Sister</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
              color: #333;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              text-align: center;
            }
            h1 {
              color: #ff6b6b;
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 20px;
              line-height: 1.5;
            }
            .button {
              background: linear-gradient(90deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
              border: none;
              color: white;
              padding: 12px 24px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              margin: 10px 0;
              cursor: pointer;
              border-radius: 25px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 8px rgba(0,0,0,0.15);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>👗 AI Fashion Sister</h1>
            <p>Your personal AI fashion assistant is ready to help.</p>
            <p>Take a photo with your Mentra glasses to get personalized fashion advice.</p>
            <p>After taking a photo, you'll receive a call with your personalized fashion advice.</p>
            <p>You can also chat with AI Fashion Sister directly:</p>
            <a href="${baseUrl}/chat-redirect" class="button">Open Chat Interface</a>
          </div>
        </body>
        </html>
      `);
    });
    
    // Chat redirect route - this will be used to redirect to an external chat interface
    app.get('/chat-redirect', (req: Request, res: Response) => {
      // In a production environment, this would redirect to a publicly accessible chat interface
      // For now, we'll redirect to the local Next.js app
      this.logger.info('Redirecting to external chat interface');
      res.redirect('http://localhost:3002/chat');
    });

  }
}

// Start the app
const app = new AIFashionSisterSimpleApp();
app.start().catch(console.error);

export { AIFashionSisterSimpleApp };
