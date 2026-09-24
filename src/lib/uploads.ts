import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { COVER_SUFFIX, THUMB_SUFFIX } from "./image-url";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
export const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const CONTENT_TYPE_FOR_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

// `File.type`/name extension are whatever the uploading browser claims —
// trivially spoofable (rename a .html file, set type="image/png"). Detecting
// the real format from the file's own magic-number bytes is what actually
// stops a disguised file from landing in storage. SVG is deliberately not
// included: it's XML that can carry <script>, not a safe raster format.
// Only used for the local-disk fallback path below — bytes uploaded
// directly to R2 via a presigned URL never pass through our server, so
// there's nothing here to inspect for that path. That's an accepted
// trade-off for this admin-only (staff-authenticated) upload tool.
const MAGIC_NUMBERS: { ext: string; bytes: number[] }[] = [
  { ext: ".jpg", bytes: [0xff, 0xd8, 0xff] },
  { ext: ".png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: ".gif", bytes: [0x47, 0x49, 0x46, 0x38] },
];

export function detectImageExt(buffer: Buffer): string | null {
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

export async function saveToLocalDisk(filename: string, buffer: Buffer): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
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

export type UploadTarget = {
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
  // Only present when the file asked for one (see prepareImageForUpload in
  // src/lib/image-prep.ts): where to PUT the small JPEG that product grids
  // show instead of the full photo. Its key is always the main file's key
  // with THUMB_SUFFIX in place of the extension, which is what lets
  // thumbUrl() (src/lib/image-url.ts) derive it from the stored URL alone.
  thumbUploadUrl?: string;
  // Same idea for cover photos (homepage covers): a 1280px copy phones get
  // instead of the original — see coverUrl()/CoverImage.
  coverUploadUrl?: string;
};

/**
 * Generates one upload destination per requested file: a presigned R2 PUT
 * URL in production, or our own local-disk route in dev when R2 isn't
 * configured. The browser then PUTs the file bytes straight to that URL —
 * bypassing our server entirely for the R2 case.
 *
 * This exists because Vercel hard-caps Server Action/Function request
 * bodies at ~4.5MB regardless of Next.js's own bodySizeLimit config; a
 * couple of phone-camera photos in one product form submission blew past
 * that and got the whole request killed with a raw network error before it
 * ever reached our code.
 */
export async function createUploadTargets(
  files: { name: string; size: number; thumb?: boolean; cover?: boolean }[]
): Promise<UploadTarget[]> {
  const config = r2Config();

  return Promise.all(
    files.map(async ({ name, size, thumb, cover }) => {
      if (size > MAX_FILE_BYTES) throw new Error(`File quá lớn: ${name}`);
      const ext = path.extname(name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error(`Định dạng không hỗ trợ: ${name}`);

      const id = randomUUID();
      const filename = `${id}${ext}`;
      const thumbFilename = `${id}${THUMB_SUFFIX}`;
      const coverFilename = `${id}${COVER_SUFFIX}`;
      const contentType = CONTENT_TYPE_FOR_EXT[ext];

      if (!config) {
        return {
          uploadUrl: `/api/admin/uploads/local/${filename}`,
          publicUrl: `/uploads/${filename}`,
          contentType,
          ...(thumb ? { thumbUploadUrl: `/api/admin/uploads/local/${thumbFilename}` } : {}),
          ...(cover ? { coverUploadUrl: `/api/admin/uploads/local/${coverFilename}` } : {}),
        };
      }

      const client = new S3Client({
        region: "auto",
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      });
      const presign = (key: string, type: string) =>
        getSignedUrl(client, new PutObjectCommand({ Bucket: config.bucket, Key: key, ContentType: type }), {
          expiresIn: 300,
        });
      const uploadUrl = await presign(filename, contentType);
      const thumbUploadUrl = thumb ? await presign(thumbFilename, "image/jpeg") : undefined;
      const coverUploadUrl = cover ? await presign(coverFilename, "image/jpeg") : undefined;

      return {
        uploadUrl,
        publicUrl: `${config.publicUrl.replace(/\/$/, "")}/${filename}`,
        contentType,
        ...(thumbUploadUrl ? { thumbUploadUrl } : {}),
        ...(coverUploadUrl ? { coverUploadUrl } : {}),
      };
    })
  );
}
