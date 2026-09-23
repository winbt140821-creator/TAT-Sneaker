// One-off: gives every product photo uploaded before grid thumbnails
// existed its "<uuid>_640.jpg" copy in R2 (see src/lib/image-url.ts).
// Only adds new objects — never modifies or deletes an original, never
// writes to the database. Safe to re-run: photos that already have a copy
// are skipped.
//
// Usage: node scripts/backfill-thumbs.mjs <env file with DATABASE_URL,
//        TURSO_AUTH_TOKEN and R2_* set>   [--dry-run]
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const [envFile, flag] = process.argv.slice(2);
const dryRun = flag === "--dry-run";
const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    })
);

const publicBase = env.R2_PUBLIC_URL.replace(/\/$/, "");
const OWN = new RegExp(`^${publicBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([0-9a-f-]{36})\\.(jpe?g|png|webp)$`, "i");

const db = createClient({ url: env.DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const rows = (await db.execute("SELECT images FROM Product")).rows;
const urls = [...new Set(rows.flatMap((r) => JSON.parse(r.images || "[]")))].filter((u) => OWN.test(u));
console.log(`${urls.length} ảnh sản phẩm trên R2${dryRun ? " (chạy thử, không ghi)" : ""}`);

let made = 0, skipped = 0, failed = 0, savedBytes = 0;
const queue = [...urls];
async function worker() {
  while (queue.length) {
    const url = queue.shift();
    const id = url.match(OWN)[1];
    const thumbKey = `${id}_640.jpg`;
    try {
      // Read through the S3 API rather than the public r2.dev URL, which
      // Cloudflare rate-limits — thousands of downloads there would get
      // throttled and could slow the live site's images down meanwhile.
      const exists = await s3.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: thumbKey })).then(() => true, () => false);
      if (exists) { skipped++; continue; }
      const obj = await s3.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: url.slice(publicBase.length + 1) }));
      const original = Buffer.from(await obj.Body.transformToByteArray());
      const thumb = await sharp(original).rotate().resize({ width: 640, height: 1280, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      if (!dryRun) {
        await s3.send(new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: thumbKey, Body: thumb, ContentType: "image/jpeg" }));
      }
      made++;
      savedBytes += original.length - thumb.length;
    } catch (err) {
      failed++;
      console.error(`Lỗi ${url}: ${err.message}`);
    }
  }
}
let last = 0;
const progress = setInterval(() => { const done = made + skipped + failed; if (done !== last) console.log(`… ${done}/${urls.length}`); last = done; }, 15000);
await Promise.all(Array.from({ length: 8 }, worker));
clearInterval(progress);
console.log(`Tạo mới: ${made}, đã có sẵn: ${skipped}, lỗi: ${failed}. Nhẹ hơn tổng cộng ${(savedBytes / 1048576).toFixed(1)} MB.`);
