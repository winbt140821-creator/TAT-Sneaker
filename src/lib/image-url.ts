// Every photo uploaded through admin also gets a small copy (≈640px wide
// JPEG) stored next to it under a predictable name: "<uuid>.jpg" →
// "<uuid>_640.jpg". Product grids show that copy instead of the original —
// next/image optimization is off (see next.config.ts), so without it a
// phone scrolling the homepage downloaded every product's full-size photo
// (measured Sept 2026: 55 photos, 24.5MB, for cards ~180px wide).
//
// Isomorphic (no env, no server imports): the name alone says whether a
// thumbnail can exist — only our own uploads are named by a bare UUID.
// Anything else (seeded demo photos, external URLs) is returned unchanged.
// Older photos got their copy from scripts/backfill-thumbs.mjs; ThumbImage
// still falls back to the original if one is ever missing.
export const THUMB_SUFFIX = "_640.jpg";

const OWN_UPLOAD = /^((?:https?:\/\/[^/?#]+)?\/(?:[^?#]*\/)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(?:jpe?g|png|webp)$/i;

export function thumbUrl(url: string): string {
  const match = url.match(OWN_UPLOAD);
  return match ? `${match[1]}${THUMB_SUFFIX}` : url;
}

// Cover photos (homepage covers) also get a 1280px-wide copy — enough for
// a phone at 3x — served to phones by CoverImage.
export const COVER_SUFFIX = "_1280.jpg";

export function coverUrl(url: string): string {
  const match = url.match(OWN_UPLOAD);
  return match ? `${match[1]}${COVER_SUFFIX}` : url;
}
