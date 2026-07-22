import { supabase } from "@/lib/supabase";

const BUCKET = "tour-images";
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

/** Scales an image down so the longest edge fits MAX_DIMENSION, keeping aspect. */
function fit(width: number, height: number): { width: number; height: number } {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) return { width, height };
  return width > height
    ? { width: MAX_DIMENSION, height: Math.round((height * MAX_DIMENSION) / width) }
    : { width: Math.round((width * MAX_DIMENSION) / height), height: MAX_DIMENSION };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode the image"));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes an image and uploads it to Supabase Storage, returning a public URL.
 *
 * Images used to be stored in the tours table as base64 data URLs: two tours
 * already meant 129 kB shipped to every visitor on every page load, and no
 * crawler can render a data: URL, so shared links had no picture. A URL keeps
 * the row tiny and lets the CDN serve and cache the file.
 */
export async function uploadTourImage(file: File): Promise<string> {
  const img = await loadImage(file);
  const size = fit(img.width, img.height);

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.drawImage(img, 0, 0, size.width, size.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY)
  );
  if (!blob) throw new Error("Could not encode the image");

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false
  });
  if (error) throw new Error(error.message);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
