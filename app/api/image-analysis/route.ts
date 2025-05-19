import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Mock AI image analysis service
function mockAIAnalysis(imageUrl: string) {
  // In a real implementation, this would call an external AI service
  // For now, return mock data with some randomization for variety
  
  const outfitTypes = [
    'dress', 'blouse with jeans', 'sweater with skirt', 
    'shirt with pants', 'jumpsuit', 'blazer with slacks'
  ];
  
  const patterns = [
    'floral', 'striped', 'solid color', 'polka dot', 
    'checkered', 'geometric', 'plain'
  ];
  
  const colors = [
    'blue', 'red', 'green', 'yellow', 'purple', 
    'pink', 'black', 'white', 'orange', 'teal'
  ];
  
  const occasions = [
    'casual outing', 'office work', 'formal event', 
    'summer party', 'winter gathering', 'weekend brunch'
  ];
  
  // Select random elements
  const randomOutfit = outfitTypes[Math.floor(Math.random() * outfitTypes.length)];
  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
  const randomColor1 = colors[Math.floor(Math.random() * colors.length)];
  const randomColor2 = colors[Math.floor(Math.random() * colors.length)];
  const randomOccasion = occasions[Math.floor(Math.random() * occasions.length)];
  
  // Create a unique set of colors (avoid duplicates)
  const outfitColors = Array.from(new Set([randomColor1, randomColor2]));
  
  // Generate description
  const description = `A stylish ${randomPattern} ${randomOutfit} in ${outfitColors.join(' and ')} tones, suitable for a ${randomOccasion}.`;
  
  // Return analysis as JSON
  return {
    description,
    items: [randomOutfit.split(' ')[0], randomPattern],
    colors: outfitColors,
    occasion: randomOccasion,
    style_score: Math.floor(Math.random() * 5) + 6, // Random score between 6-10
    suggestions: [
      `Consider accessorizing with ${randomColor1 === 'black' ? 'silver' : 'gold'} jewelry`,
      `This would pair well with ${randomColor1 === 'white' ? 'colorful' : 'neutral'} shoes`,
      `Try adding a ${outfitColors.includes('black') ? 'pop of color' : 'black accessory'} to complete the look`
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { outfitId, imageUrl } = body;
    
    if (!outfitId && !imageUrl) {
      return NextResponse.json(
        { error: 'Either outfitId or imageUrl is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    let outfitImageUrl = imageUrl;
    let outfit;
    
    // If outfitId is provided, fetch the outfit details from database
    if (outfitId) {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('id', outfitId)
        .single();
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch outfit details' },
          { status: 500 }
        );
      }
      
      if (!data) {
        return NextResponse.json(
          { error: 'Outfit not found' },
          { status: 404 }
        );
      }
      
      outfit = data;
      outfitImageUrl = data.image_url;
    }
    
    // Call the AI service (mocked for now)
    const analysis = mockAIAnalysis(outfitImageUrl);
    
    // If we have an outfitId, update the outfit record with the analysis
    if (outfitId && outfit) {
      const { error: updateError } = await supabase
        .from('outfits')
        .update({
          initial_ai_analysis: analysis,
          feedback_status: 'initial_ai_complete'
        })
        .eq('id', outfitId);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update outfit with analysis' },
          { status: 500 }
        );
      }
    }
    
    // Return the analysis
    return NextResponse.json({ analysis });
    
  } catch (error) {
    console.error('Error in image analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 