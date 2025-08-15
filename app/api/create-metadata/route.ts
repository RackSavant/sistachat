import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { outfitId, imageUrl, notes, userId } = await request.json();

    // Verify the user owns this outfit
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .select('*')
      .eq('id', outfitId)
      .eq('user_id', userId)
      .single();

    if (outfitError || !outfit) {
      return NextResponse.json(
        { error: 'Outfit not found or access denied' },
        { status: 404 }
      );
    }

    // In a real app, you would upload this to IPFS or Arweave
    // For now, we'll create a simple metadata object
    const metadata = {
      name: `Outfit #${outfitId.slice(0, 6)}`,
      symbol: 'SISTA',
      description: notes || 'A tokenized fashion item from SistaChat',
      image: imageUrl,
      attributes: [
        {
          trait_type: 'Created At',
          value: new Date().toISOString(),
        },
      ],
      properties: {
        files: [
          {
            uri: imageUrl,
            type: 'image/jpeg',
          },
        ],
        category: 'image',
        creators: [
          {
            address: userId, // This would be the Solana wallet address in a real app
            share: 100,
          },
        ],
      },
    };

    // In a production app, you would upload this to IPFS or Arweave here
    // For now, we'll just return a mock URI
    const metadataUri = `https://sistachat.com/api/metadata/${outfitId}`;

    // Update the outfit with the tokenization status
    const { error: updateError } = await supabase
      .from('outfits')
      .update({ 
        is_tokenized: true,
        token_metadata_uri: metadataUri,
        tokenized_at: new Date().toISOString(),
      })
      .eq('id', outfitId);

    if (updateError) {
      console.error('Error updating outfit:', updateError);
      // Continue anyway, as the metadata was created
    }

    return NextResponse.json({ 
      success: true, 
      metadataUri,
      metadata, // In production, this would be uploaded to IPFS/Arweave
    });
  } catch (error) {
    console.error('Error creating metadata:', error);
    return NextResponse.json(
      { error: 'Failed to create metadata' },
      { status: 500 }
    );
  }
}
