/**
 * imageUpload.ts
 *
 * Buffer → Sharp → WebP
 *
 * Compresses/resizes an image and returns the optimized buffer.
 */

import sharp from "sharp";

export interface OptimizedImageResult {
  buffer: Buffer;
  size: number;
  format: "webp";
}

/**
 * Compress and convert an image to WebP.
 *
 * - Maximum width: 800px
 * - Does not enlarge smaller images
 * - WebP quality: 80
 *
 * @param buffer Raw image buffer
 */
export async function optimizeImage(
  buffer: Buffer,
): Promise<OptimizedImageResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Image buffer is empty");
  }

  const optimized = await sharp(buffer)
    .resize({
      width: 800,
      withoutEnlargement: true,
    })
    .webp({
      quality: 80,
    })
    .toBuffer();

  return {
    buffer: optimized,
    size: optimized.length,
    format: "webp",
  };
}

export default optimizeImage;