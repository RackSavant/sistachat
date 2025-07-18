import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateImmediateFeedback } from '@/lib/ai-sister';
import { generateFashionAdviceSpeech } from '@/lib/openai-tts';
import { addMentraPhotoServerSide } from '@/lib/mentra-chat-context';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  console.log('📸 Mentra OS webhook received at /webhook');
  
  try {
    // Parse the incoming data from Mentra OS
    const body = await request.json();
    console.log('📥 Mentra OS webhook data:', {
      hasImage: !!body.image,
      hasImageUrl: !!body.imageUrl,
      hasImageData: !!body.imageData,
      packageName: body.packageName,
      timestamp: body.timestamp,
      fullBody: body // Log full body to see what Mentra actually sends
    });

    // Validate the request is from our registered Mentra app
    const expectedPackageName = process.env.MENTRA_PACKAGE_NAME;
    if (expectedPackageName && body.packageName !== expectedPackageName) {
      console.error('❌ Invalid package name:', body.packageName);
      return NextResponse.json({ error: 'Invalid package name' }, { status: 401 });
    }

    // Extract image data (Mentra OS can send different formats)
    let imageData: string | null = null;
    let imageUrl: string | null = null;

    if (body.image) {
      imageData = body.image;
      console.log('📄 Received base64 image in "image" field');
    } else if (body.imageData) {
      imageData = body.imageData;
      console.log('📄 Received base64 image in "imageData" field');
    } else if (body.imageUrl) {
      imageUrl = body.imageUrl;
      console.log('🔗 Received image URL:', imageUrl);
    } else {
      console.error('❌ No image data received');
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // For now, we'll use a default user ID or create a system user
    const defaultUserId = process.env.MENTRA_DEFAULT_USER_ID;
    if (!defaultUserId) {
      console.error('❌ MENTRA_DEFAULT_USER_ID not configured');
      return NextResponse.json({ error: 'User configuration missing' }, { status: 500 });
    }

    let finalImageUrl: string;

    if (imageData) {
      // Upload base64 image to Supabase
      console.log('📤 Uploading base64 image to Supabase...');
      
      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate filename
      const fileName = `${defaultUserId}/mentra-${Date.now()}.jpg`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('raw-images')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('raw-images')
        .getPublicUrl(fileName);

      finalImageUrl = publicUrl;
      console.log('✅ Image uploaded to:', finalImageUrl);
    } else {
      // Use the provided image URL
      finalImageUrl = imageUrl!;
      console.log('🔗 Using provided image URL:', finalImageUrl);
    }

    // Analyze the image with AI Sister
    console.log('🤖 Analyzing outfit with AI Sister...');
    const feedback = await generateImmediateFeedback(finalImageUrl);
    console.log('✅ AI analysis complete:', feedback);

    // Generate speech from the feedback
    console.log('🔊 Converting feedback to speech...');
    const audioBuffer = await generateFashionAdviceSpeech(feedback);
    console.log('✅ Speech generated, uploading to storage...');

    // Upload audio to Supabase storage
    const audioFileName = `${defaultUserId}/mentra-audio-${Date.now()}.mp3`;
    const { data: audioUploadData, error: audioUploadError } = await supabase.storage
      .from('outfits')
      .upload(audioFileName, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (audioUploadError) {
      console.error('❌ Audio upload error:', audioUploadError);
      return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
    }

    // Get public URL for audio
    const { data: { publicUrl: audioUrl } } = supabase.storage
      .from('outfits')
      .getPublicUrl(audioFileName);

    console.log('✅ Audio uploaded to:', audioUrl);

    // Store the interaction in our database
    const { error: insertError } = await supabase
      .from('mentra_interactions')
      .insert({
        user_id: defaultUserId,
        image_url: finalImageUrl,
        ai_response: feedback,
        audio_url: audioUrl,
        interaction_type: 'glasses_photo',
        mentra_package_name: body.packageName,
        timestamp: body.timestamp || new Date().toISOString(),
        status: 'completed'
      });

    if (insertError) {
      console.error('⚠️ Failed to store interaction:', insertError);
      // Don't fail the request if we can't store the interaction
    }

    // Generate a unique ID for the photo
    const photoId = uuidv4();
    const timestamp = new Date().toISOString();

    // Store the photo in the mentra_chat_photos table for chat integration
    const { error: chatPhotoError } = await supabase
      .from('mentra_chat_photos')
      .insert({
        id: photoId,
        image_url: finalImageUrl,
        audio_url: audioUrl,
        feedback: feedback,
        timestamp: timestamp,
        status: 'new',
        user_id: defaultUserId
      });

    if (chatPhotoError) {
      console.error('⚠️ Failed to store photo for chat integration:', chatPhotoError);
    } else {
      console.log('✅ Photo stored for chat integration with ID:', photoId);
      
      // Add to the chat context for real-time updates
      await addMentraPhotoServerSide({
        id: photoId,
        imageUrl: finalImageUrl,
        audioUrl: audioUrl,
        feedback: feedback,
        timestamp: timestamp
      });
    }

    // Return success response with audio URL for Mentra OS glasses
    return NextResponse.json({
      success: true,
      message: 'Photo analyzed and fashion advice ready! 🔥',
      imageUrl: finalImageUrl,
      audioUrl: audioUrl,
      feedback: feedback,
      action: 'play_audio', // Tell Mentra to play the audio through glasses speakers
      chatIntegrationId: photoId // Include the chat integration ID
    });

  } catch (error) {
    console.error('💥 Error in Mentra webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 