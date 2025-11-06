import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const BUCKET_NAME = 'Questionnaire Images';
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'gif', 'webp'];

/**
 * Upload an image buffer to Supabase Storage
 * @param {Buffer} imageBuffer - The image data as a buffer
 * @param {string} originalName - Original filename (for extension detection)
 * @param {string} userId - User ID for organizing files
 * @returns {Promise<{url: string, path: string} | {error: string}>}
 */
export async function uploadImage(imageBuffer, originalName = 'image.png', userId = 'anonymous') {
  try {
    // Optimize and convert image using sharp
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(1200, 1200, { // Max dimensions
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 }) // Convert to JPEG for consistency
      .toBuffer();

    // Check file size after optimization
    if (optimizedBuffer.length > MAX_IMAGE_SIZE) {
      // If still too large, compress more aggressively
      const moreCompressed = await sharp(imageBuffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();
      
      if (moreCompressed.length > MAX_IMAGE_SIZE) {
        return { error: 'Image is too large. Please use a smaller image.' };
      }
      
      return await uploadToStorage(moreCompressed, userId, 'jpg');
    }

    return await uploadToStorage(optimizedBuffer, userId, 'jpg');

  } catch (error) {
    console.error('Error uploading image:', error);
    return { error: `Failed to upload image: ${error.message}` };
  }
}

/**
 * Upload buffer to Supabase Storage
 */
async function uploadToStorage(buffer, userId, extension) {
  const fileName = `${userId}/${uuidv4()}.${extension}`;
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      contentType: `image/${extension}`,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Supabase storage error:', error);
    return { error: error.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return {
    url: urlData.publicUrl,
    path: fileName
  };
}

/**
 * Delete an image from Supabase Storage
 * @param {string} imagePath - The path/filename in storage
 * @returns {Promise<{success: boolean} | {error: string}>}
 */
export async function deleteImage(imagePath) {
  try {
    if (!imagePath) {
      return { error: 'No image path provided' };
    }

    // Extract path from URL if full URL was provided
    const path = imagePath.includes(BUCKET_NAME) 
      ? imagePath.split(BUCKET_NAME + '/')[1]
      : imagePath;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return { error: error.message };
  }
}

/**
 * Upload multiple images
 * @param {Array<{buffer: Buffer, name: string}>} images
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function uploadMultipleImages(images, userId = 'anonymous') {
  const uploadPromises = images.map(img => uploadImage(img.buffer, img.name, userId));
  return await Promise.all(uploadPromises);
}

/**
 * Validate image format
 */
export function isValidImageFormat(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ALLOWED_FORMATS.includes(ext);
}

export default {
  uploadImage,
  deleteImage,
  uploadMultipleImages,
  isValidImageFormat
};

