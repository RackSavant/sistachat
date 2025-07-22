import { createClient } from '@supabase/supabase-js';

// Storage utility functions for Supabase
export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadOptions {
  bucket?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  generateUniqueName?: boolean;
}

/**
 * Upload an image to Supabase storage with proper error handling and validation
 */
export async function uploadImage(
  file: File,
  userId: string,
  supabase: any,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    bucket = 'raw-images',
    maxSizeBytes = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    generateUniqueName = true
  } = options;

  try {
    // Validate file size
    if (file.size > maxSizeBytes) {
      return {
        success: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB`
      };
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type ${file.type} not allowed. Supported types: ${allowedTypes.join(', ')}`
      };
    }

    // Generate file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = generateUniqueName 
      ? `${userId}/${timestamp}-${sanitizedFileName}`
      : `${userId}/${sanitizedFileName}`;

    console.log('📤 Starting image upload:', {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      userId,
      bucket
    });

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    console.log('🗂️ Upload result:', { uploadData, uploadError });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log('🌐 Generated public URL:', publicUrl);

    // Test URL accessibility
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      console.log('🔍 URL accessibility check:', {
        url: publicUrl,
        status: response.status,
        accessible: response.ok
      });

      if (!response.ok) {
        console.warn(`⚠️ Image uploaded but not publicly accessible: HTTP ${response.status}`);
        // Don't fail the upload - this might be due to RLS policies
      }
    } catch (urlError) {
      console.warn('⚠️ URL accessibility check failed:', urlError);
      // Continue anyway - the upload succeeded
    }

    return {
      success: true,
      url: publicUrl,
      path: fileName
    };

  } catch (error) {
    console.error('💥 Unexpected upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Delete an image from Supabase storage
 */
export async function deleteImage(
  path: string,
  supabase: any,
  bucket: string = 'raw-images'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('❌ Delete error:', error);
      return {
        success: false,
        error: `Delete failed: ${error.message}`
      };
    }

    console.log('🗑️ Image deleted successfully:', path);
    return { success: true };

  } catch (error) {
    console.error('💥 Unexpected delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error'
    };
  }
}

/**
 * Check if a bucket exists and is accessible
 */
export async function checkBucketAccess(
  bucket: string,
  supabase: any
): Promise<{ accessible: boolean; error?: string }> {
  try {
    // Try to list files in the bucket (this will fail if bucket doesn't exist or isn't accessible)
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', { limit: 1 });

    if (error) {
      return {
        accessible: false,
        error: error.message
      };
    }

    return { accessible: true };

  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
