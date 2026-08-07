import { supabase } from "@/integrations/supabase/client";

export const IMAGE_BUCKET = "item-images";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_DIMENSION = 1600;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Please choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "That image is larger than 10 MB. Try a smaller one.";
  }
  return null;
}

/** Resize to fit MAX_DIMENSION and compress toward ~1 MB. Falls back to the original file. */
export async function compressImage(file: File): Promise<Blob> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    for (const quality of [0.85, 0.7, 0.55]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, quality),
      );
      if (!blob) break;
      if (blob.size <= 1024 * 1024 || quality === 0.55) return blob;
    }
    return file;
  } catch {
    return file;
  }
}

export async function uploadItemImage(userId: string, itemId: string, file: File) {
  const blob = await compressImage(file);
  const ext = blob.type === "image/png" ? "png" : "jpg";
  const path = `${userId}/${itemId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function removeItemImage(path: string) {
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path]);
  if (error) throw error;
}

/** Remove every stored image for an item (used when an item is deleted permanently). */
export async function removeAllItemImages(userId: string, itemId: string) {
  const { data } = await supabase.storage.from(IMAGE_BUCKET).list(`${userId}/${itemId}`);
  if (!data?.length) return;
  await supabase.storage
    .from(IMAGE_BUCKET)
    .remove(data.map((f) => `${userId}/${itemId}/${f.name}`));
}

export async function signedImageUrl(path: string) {
  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
