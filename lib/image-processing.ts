import Replicate from 'replicate';
import sharp from 'sharp';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export interface ProcessedImage {
  originalUrl: string;
  processedUrl: string;
  enhancedUrl?: string;
}

export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Convert buffer to base64 for Replicate API
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    // Use Replicate's background removal model
    const output = await replicate.run(
      "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
      {
        input: {
          image: base64Image
        }
      }
    ) as unknown as string;

    // Download the processed image
    const response = await fetch(output);
    const processedBuffer = Buffer.from(await response.arrayBuffer());
    
    return processedBuffer;
  } catch (error) {
    console.error('Background removal failed:', error);
    // Return original image if processing fails
    return imageBuffer;
  }
}

export async function enhanceImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Use Sharp for basic image enhancement
    const enhanced = await sharp(imageBuffer)
      .resize(1024, 1024, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .sharpen()
      .normalize()
      .jpeg({ quality: 90 })
      .toBuffer();

    return enhanced;
  } catch (error) {
    console.error('Image enhancement failed:', error);
    return imageBuffer;
  }
}

export async function processOutfitImage(imageBuffer: Buffer): Promise<{
  original: Buffer;
  backgroundRemoved: Buffer;
  enhanced: Buffer;
}> {
  try {
    // Process in parallel for better performance
    const [backgroundRemoved, enhanced] = await Promise.all([
      removeBackground(imageBuffer),
      enhanceImage(imageBuffer)
    ]);

    return {
      original: imageBuffer,
      backgroundRemoved,
      enhanced
    };
  } catch (error) {
    console.error('Image processing failed:', error);
    // Return original for all if processing fails
    return {
      original: imageBuffer,
      backgroundRemoved: imageBuffer,
      enhanced: imageBuffer
    };
  }
}

// Stub function for shopping suggestions - returns sample data for now
export async function generateShoppingSuggestions(imageUrl: string): Promise<any[]> {
  // This is a stub that returns sample data
  // In the future, this would use computer vision to analyze the outfit
  // and search for similar items from shopping APIs
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  
  return [
    {
      id: '1',
      name: 'Similar Top',
      price: '$29.99',
      brand: 'Fashion Brand',
      url: 'https://example.com/item1',
      image: 'https://via.placeholder.com/200x200',
      similarity: 0.85
    },
    {
      id: '2',
      name: 'Matching Bottom',
      price: '$39.99',
      brand: 'Style Co',
      url: 'https://example.com/item2',
      image: 'https://via.placeholder.com/200x200',
      similarity: 0.78
    },
    {
      id: '3',
      name: 'Perfect Accessory',
      price: '$19.99',
      brand: 'Accessory Plus',
      url: 'https://example.com/item3',
      image: 'https://via.placeholder.com/200x200',
      similarity: 0.72
    }
  ];
} 