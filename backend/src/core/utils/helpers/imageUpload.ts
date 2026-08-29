/**
 * imageUpload.ts
 * Multer (in-memory) → Sharp (compress/resize to WebP) → Supabase Storage
 *
 * Usage in a Fastify route:
 *   import { uploadProductImage, deleteProductImage } from "../utils/helpers/imageUpload";
 *   const url = await uploadProductImage(req.file.buffer, `product-${id}`);
 *   await deleteProductImage("product-some-id.webp");
 */

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET,
} from "../../config/envConfig";
import logger from "../../config/loggerConfig";

// Use service-role key for server-side uploads (bypasses row-level security)
function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

const BUCKET = SUPABASE_STORAGE_BUCKET || "product-images";

/**
 * Compress an image buffer with sharp (→ WebP, max 800px wide, quality 80)
 * and upload it to Supabase Storage.
 *
 * @param buffer   Raw file buffer from multer memoryStorage
 * @param filename Base filename WITHOUT extension. Will be stored as `<filename>.webp`
 * @returns        Public URL of the uploaded image
 */
export async function uploadProductImage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const supabase = getSupabase();

  // Compress & convert to WebP
  const optimized = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const path = `${filename}.webp`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimized, {
      contentType: "image/webp",
      upsert: true, // overwrite if same filename already exists
    });

  if (error) {
    logger.error(`Supabase upload failed: ${error.message}`);
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Delete an image from Supabase Storage by its stored path (filename with extension).
 * Silently logs if the file doesn't exist — never throws.
 *
 * @param path  The stored path, e.g. "product-abc123.webp"
 */
export async function deleteProductImage(path: string): Promise<void> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      logger.warn(`Supabase delete warning for ${path}: ${error.message}`);
    }
  } catch (err: any) {
    logger.warn(`deleteProductImage skipped: ${err.message}`);
  }
}

/**
 * Extract the storage path from a full Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/product-images/product-abc.webp"
 *      → "product-abc.webp"
 * Returns null if URL doesn't match Supabase storage pattern.
 */
export function extractSupabasePath(url: string | null): string | null {
  if (!url) return null;
  try {
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  } catch {
    return null;
  }
}
