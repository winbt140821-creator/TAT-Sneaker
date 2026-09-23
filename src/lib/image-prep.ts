// Browser-only (canvas). Runs in admin right before an upload, so what lands
// in R2 is already web-sized — there's no server-side resize step anywhere
// (next/image optimization is off, see next.config.ts), so whatever gets
// uploaded here is exactly what every customer downloads.
//
// - Camera photos (JPEG/WebP) over MAX_EDGE or MAX_BYTES are re-encoded to a
//   JPEG no longer than MAX_EDGE on its long side. A 1.1MB shop photo came
//   out at ~160KB at 1500px with no visible difference.
// - PNG/GIF are uploaded untouched: logos need their transparency, and a
//   GIF may be animated.
// - Every raster also gets a THUMB_WIDTH-wide JPEG copy for product grids
//   (see src/lib/image-url.ts).
// JPEG rather than WebP on purpose: the social-media manager posts these
// same URLs to Instagram, whose publishing API only accepts JPEG.
// Any decoding failure just uploads the original with no thumbnail — never
// blocks the upload itself.

const MAX_EDGE = 2000;
const MAX_BYTES = 900 * 1024;
const THUMB_WIDTH = 640;

async function encode(bitmap: ImageBitmap, width: number, height: number, quality: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // Transparent PNG pixels would otherwise encode as black in a JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function fit(w: number, h: number, maxW: number, maxH: number) {
  const scale = Math.min(1, maxW / w, maxH / h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

export async function prepareImageForUpload(file: File): Promise<{ file: File; thumb: Blob | null }> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { file, thumb: null };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { file, thumb: null };
  }

  try {
    let out = file;
    const isPhoto = file.type !== "image/png";
    if (isPhoto && (Math.max(bitmap.width, bitmap.height) > MAX_EDGE || file.size > MAX_BYTES)) {
      const size = fit(bitmap.width, bitmap.height, MAX_EDGE, MAX_EDGE);
      const blob = await encode(bitmap, size.width, size.height, 0.86);
      if (blob && blob.size < file.size) {
        out = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      }
    }

    const t = fit(bitmap.width, bitmap.height, THUMB_WIDTH, THUMB_WIDTH * 2);
    const thumb = await encode(bitmap, t.width, t.height, 0.8);
    return { file: out, thumb };
  } catch {
    return { file, thumb: null };
  } finally {
    bitmap.close();
  }
}
