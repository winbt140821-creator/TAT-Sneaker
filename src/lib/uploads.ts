import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB

// `File.type` is whatever Content-Type the uploading browser/client claims —
// trivially spoofable (rename a .html file, set type="image/png"). Detecting
// the real format from the file's own magic-number bytes is what actually
// stops a disguised file from landing in storage. SVG is deliberately not
// included: it's XML that can carry <script>, not a safe raster format.
const MAGIC_NUMBERS: { ext: string; bytes: number[] }[] = [
  { ext: ".jpg", bytes: [0xff, 0xd8, 0xff] },
  { ext: ".png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: ".gif", bytes: [0x47, 0x49, 0x46, 0x38] },
];

const CONTENT_TYPE_FOR_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

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

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

async function saveToR2(
  config: NonNullable<ReturnType<typeof r2Config>>,
  filename: string,
  ext: string,
  buffer: Buffer,
): Promise<string> {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: filename,
      Body: buffer,
      ContentType: CONTENT_TYPE_FOR_EXT[ext] ?? "application/octet-stream",
    }),
  );
  return `${config.publicUrl.replace(/\/$/, "")}/${filename}`;
}

async function saveToLocalDisk(filename: string, buffer: Buffer): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

/**
 * Saves uploaded image files and returns their public URLs.
 *
 * Vercel's serverless functions have no persistent local disk, so production
 * needs real object storage — Cloudflare R2 (S3-compatible, and free egress,
 * which matters for serving product photos to ad traffic). Falls back to
 * writing into public/uploads when R2 isn't configured, purely so local dev
 * keeps working without needing an R2 account.
 */
export async function saveUploadedImages(files: File[]): Promise<string[]> {
  const withinSizeLimit = files.filter((f) => f && f.size > 0 && f.size <= MAX_FILE_BYTES);
  if (withinSizeLimit.length === 0) return [];

  const config = r2Config();

  const urls: string[] = [];
  for (const file of withinSizeLimit) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExt(buffer);
    if (!ext) continue; // not a real JPEG/PNG/GIF/WEBP — skip, regardless of claimed Content-Type

    const filename = `${randomUUID()}${ext}`;
    urls.push(config ? await saveToR2(config, filename, ext, buffer) : await saveToLocalDisk(filename, buffer));
  }
  return urls;
}
