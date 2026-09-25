import { randomUUID } from "crypto";
import sharp from "sharp";
import { THUMB_SUFFIX } from "./image-url";
import { storeServerFile } from "./uploads";
import { fetchPhoto } from "./yupoo";

// The server-side twin of prepareImageForUpload (src/lib/image-prep.ts):
// same limits, same "<uuid>.jpg" + "<uuid>_640.jpg" pair, so an imported
// photo behaves exactly like one staff uploaded by hand — grids use the
// thumbnail, Instagram gets a JPEG. Re-encoding also drops the supplier's
// camera metadata.
const MAX_EDGE = 2000;
const THUMB_WIDTH = 640;

/** Copies one Yupoo photo into our own storage; returns its public URL. */
export async function importYupooPhoto(owner: string, url: string): Promise<string> {
  const { bytes } = await fetchPhoto(owner, url);
  const source = sharp(bytes, { failOn: "error" }).rotate();
  const [main, thumb] = await Promise.all([
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
  const id = randomUUID();
  const [publicUrl] = await Promise.all([
    storeServerFile(`${id}.jpg`, main, "image/jpeg"),
    storeServerFile(`${id}${THUMB_SUFFIX}`, thumb, "image/jpeg"),
  ]);
  return publicUrl;
}
