import { createClient } from '@/lib/supabase/client';
import imageCompression from 'browser-image-compression';

/**
 * Compresses an image client-side then uploads it to a Supabase Storage bucket.
 * Returns the public URL, or throws on failure.
 */
export async function uploadImage(
  file: File,
  bucket: 'blog-images' | 'avatars' | 'listing-images' | 'scan-images',
  pathPrefix: string = ''
): Promise<string> {
  const supabase = createClient();

  // Compress before upload — critical for farmers on mobile data in Nigeria
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp',
  });

  const fileExt = 'webp';
  const fileName = `${pathPrefix}${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, compressed, {
    cacheControl: '31536000',
    upsert: false,
    contentType: 'image/webp',
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}
