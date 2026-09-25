import type { NextRequest } from "next/server";
import { staffImportSource } from "@/lib/import-source";
import { fetchPhoto } from "@/lib/yupoo";

// Album covers for the import screen's grid. Yupoo refuses its photos to
// other sites' pages, so they're relayed through here — only small cover
// copies, only from the shop the request names (see fetchPhoto).
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const auth = await staffImportSource(params.get("source"));
  if ("error" in auth) return new Response(null, { status: auth.status });
  const src = params.get("src") ?? "";
  if (!/\/(small|medium|square)\.(jpe?g|png|webp)$/i.test(src)) return new Response(null, { status: 400 });

  try {
    const { bytes, contentType } = await fetchPhoto(auth.source.owner, src);
    return new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": contentType === "image/jpg" ? "image/jpeg" : contentType, "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
