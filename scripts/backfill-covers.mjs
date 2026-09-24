// One-off, companion to backfill-thumbs.mjs: gives every cover photo
// uploaded before cover copies existed its "<uuid>_1280.jpg" copy (what
// phones get, see CoverImage), and every category photo its
// "<uuid>_640.jpg" (category tiles, see ThumbImage). Only adds new objects —
// never modifies or deletes an original, never writes to the database.
// Safe to re-run: existing copies are skipped.
//
// Usage: node scripts/backfill-covers.mjs <env file with DATABASE_URL,
//        TURSO_AUTH_TOKEN and R2_* set>
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const env = Object.fromEntries(
  readFileSync(process.argv[2], "utf8")
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

const covers = new Set();
for (const table of ["StorefrontBranding", "SiteSettings"]) {
  for (const r of (await db.execute(`SELECT heroImages, heroImageUrl FROM "${table}"`)).rows) {
    for (const u of JSON.parse(r.heroImages || "[]")) covers.add(u);
    if (r.heroImageUrl) covers.add(r.heroImageUrl);
  }
}
const tiles = new Set(
  (await db.execute(`SELECT showcaseImageUrl FROM "Category" WHERE showcaseImageUrl IS NOT NULL`)).rows.map((r) => r.showcaseImageUrl)
);
const jobs = [
  ...[...covers].map((url) => ({ url, suffix: "_1280.jpg", width: 1280, quality: 82 })),
  ...[...tiles].map((url) => ({ url, suffix: "_640.jpg", width: 640, quality: 80 })),
].filter((j) => OWN.test(j.url));
console.log(`${covers.size} cover photos, ${tiles.size} category photos → ${jobs.length} to check`);

let made = 0, skipped = 0, failed = 0, before = 0, after = 0;
for (const { url, suffix, width, quality } of jobs) {
  const id = url.match(OWN)[1];
  const key = `${id}${suffix}`;
  try {
    const exists = await s3.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key })).then(() => true, () => false);
    if (exists) { skipped++; continue; }
    const obj = await s3.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: url.slice(publicBase.length + 1) }));
    const original = Buffer.from(await obj.Body.transformToByteArray());
    const out = await sharp(original).rotate().resize({ width, height: width * 2, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" }).jpeg({ quality, mozjpeg: true }).toBuffer();
    await s3.send(new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, Body: out, ContentType: "image/jpeg" }));
    made++;
    before += original.length;
    after += out.length;
    console.log(`${key}: ${(original.length / 1024).toFixed(0)}KB → ${(out.length / 1024).toFixed(0)}KB`);
  } catch (err) {
    failed++;
    console.error(`Lỗi ${url}: ${err.message}`);
  }
}
console.log(`Tạo mới: ${made}, đã có sẵn: ${skipped}, lỗi: ${failed}. ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB`);
