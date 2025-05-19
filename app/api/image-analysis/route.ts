import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai';

// Mock AI image analysis service

async function analyzeImage(imageUrl: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a fashion consultant with expertise in clothing analysis and styling. Provide detailed analysis of clothing items in images, focusing on style, fit, color coordination, and suitability for different occasions."
        },
        {
          role: "user",
          content: `Analyze the clothing in this image: ${imageUrl}. Provide a detailed analysis including:
          1. Description of the outfit and its components
          2. Color scheme and patterns
          3. Style rating (1-10)
          4. Occasion suitability
          5. Styling suggestions
          
          Format your response as JSON with these fields:
          {
            "description": "Detailed outfit description",
            "items": ["list", "of", "clothing", "items"],
            "colors": ["list", "of", "colors"],
            "occasion": "suitable occasion",
            "style_score": number,
            "suggestions": ["list", "of", "styling", "suggestions"]
          }`
        }
      ],
      temperature: 0.7,
      response_format: {
        type: "json_object"
      }
    });

    // Parse the JSON response
    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image');
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const outfitId = formData.get('outfitId') as string | null;

    if (!file || !outfitId || typeof outfitId !== 'string') {
      return NextResponse.json({ error: 'Image and outfitId are required' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = await createClient();

    // Upload file to Supabase storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('outfits')
      .upload(`outfit-${outfitId}/${file.name}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = await supabase.storage
      .from('outfits')
      .getPublicUrl(`outfit-${outfitId}/${file.name}`);

    const publicUrl = publicUrlData.publicUrl;

    // Analyze the image with OpenAI
    const analysis = await analyzeImage(publicUrl);

    // Store analysis in Supabase
    const { error: insertError } = await supabase
      .from('outfit_analysis')
      .insert({
        outfit_id: outfitId,
        image_url: publicUrl,
        description: analysis.description,
        items: analysis.items,
        colors: analysis.colors,
        occasion: analysis.occasion,
        style_score: analysis.style_score,
        suggestions: analysis.suggestions
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis,
      imageUrl: publicUrl
    });
  } catch (error) {
    console.error('Error in image analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}