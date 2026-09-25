import { randomUUID } from "crypto";
import sharp from "sharp";
import { THUMB_SUFFIX } from "./image-url";
import { safeFetch } from "./safe-fetch";
import { storeServerFile } from "./uploads";
import { fetchPhoto } from "./yupoo";

// The server-side twin of prepareImageForUpload (src/lib/image-prep.ts):
// same limits, same "<uuid>.jpg" + "<uuid>_640.jpg" pair, so an imported
// photo behaves exactly like one staff uploaded by hand — grids use the
// thumbnail, Instagram gets a JPEG. Re-encoding also drops the source's
// camera metadata, and anything that isn't really an image fails here.
const MAX_EDGE = 2000;
const THUMB_WIDTH = 640;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export class ImportPhotoError extends Error {}

/** Stores photo bytes as our own upload; returns its public URL. */
export async function storeImportedPhoto(bytes: Buffer): Promise<string> {
  const source = sharp(bytes, { failOn: "error" }).rotate();
  let main: Buffer;
  let thumb: Buffer;
  try {
    [main, thumb] = await Promise.all([
      source
        .clone()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 86, mozjpeg: true })
        .toBuffer(),
      source
        .clone()
        .resize({ width: THUMB_WIDTH, height: THUMB_WIDTH * 2, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer(),
    ]);
  } catch {
    throw new ImportPhotoError("File này không phải ảnh hoặc bị hỏng.");
  }
  const id = randomUUID();
  const [publicUrl] = await Promise.all([
    storeServerFile(`${id}.jpg`, main, "image/jpeg"),
    storeServerFile(`${id}${THUMB_SUFFIX}`, thumb, "image/jpeg"),
  ]);
  return publicUrl;
}

/** Copies one Yupoo photo into our own storage. */
export async function importYupooPhoto(owner: string, url: string): Promise<string> {
  const { bytes } = await fetchPhoto(owner, url);
  return storeImportedPhoto(bytes);
}

/** Downloads a photo from any site, as if viewed from `referer` (the page
 *  it was on — some sites refuse photos otherwise). */
export async function downloadWebPhoto(url: string, referer?: string): Promise<Buffer> {
  const res = await safeFetch(url, {
    accept: "image/avif,image/webp,image/*,*/*;q=0.8",
    referer,
    maxBytes: MAX_PHOTO_BYTES,
  });
  if (res.status !== 200) throw new ImportPhotoError(`Trang ảnh trả lỗi ${res.status}.`);
  return res.body;
}

/** Copies one photo from any site into our own storage. */
export async function importWebPhoto(url: string, referer?: string): Promise<string> {
  return storeImportedPhoto(await downloadWebPhoto(url, referer));
}
