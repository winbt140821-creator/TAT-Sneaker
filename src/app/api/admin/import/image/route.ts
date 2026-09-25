import sharp from "sharp";
import type { NextRequest } from "next/server";
import { isStaffRequest } from "@/lib/staff-api";
import { downloadWebPhoto } from "@/lib/import-photo";

// Small previews of other sites' photos for the import screen. The admin's
// security policy only lets pages show our own images, and many shops
// refuse photos to other sites anyway — so they're fetched here and shrunk.
export async function GET(request: NextRequest) {
  if (!(await isStaffRequest())) return new Response(null, { status: 401 });
  const params = request.nextUrl.searchParams;
  const ref = params.get("ref");
  try {
    const bytes = await downloadWebPhoto(params.get("url") ?? "", ref && /^https?:\/\//.test(ref) ? ref : undefined);
    const preview = await sharp(bytes, { failOn: "error" })
      .rotate()
      .resize({ width: 360, height: 360, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 70 })
      .toBuffer();
    return new Response(new Uint8Array(preview), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
