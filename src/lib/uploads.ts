import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB

// `File.type` is whatever Content-Type the uploading browser/client claims —
// trivially spoofable (rename a .html file, set type="image/png"). Detecting
// the real format from the file's own magic-number bytes is what actually
// stops a disguised file from landing in public/uploads. SVG is deliberately
// not included: it's XML that can carry <script>, not a safe raster format.
const MAGIC_NUMBERS: { ext: string; bytes: number[] }[] = [
  { ext: ".jpg", bytes: [0xff, 0xd8, 0xff] },
  { ext: ".png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: ".gif", bytes: [0x47, 0x49, 0x46, 0x38] },
];

function detectImageExt(buffer: Buffer): string | null {
  for (const { ext, bytes } of MAGIC_NUMBERS) {
    if (bytes.every((b, i) => buffer[i] === b)) return ext;
  }
  // WEBP: "RIFF" .... "WEBP" — the 4 size bytes in between vary per file.
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return ".webp";
  }
  return null;
}

/** Saves uploaded image files to public/uploads (VPS filesystem storage) and returns their public URLs. */
export async function saveUploadedImages(files: File[]): Promise<string[]> {
  const withinSizeLimit = files.filter((f) => f && f.size > 0 && f.size <= MAX_FILE_BYTES);
  if (withinSizeLimit.length === 0) return [];

  await mkdir(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];
  for (const file of withinSizeLimit) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExt(buffer);
    if (!ext) continue; // not a real JPEG/PNG/GIF/WEBP — skip, regardless of claimed Content-Type

    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    urls.push(`/uploads/${filename}`);
  }
  return urls;
}
