import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { staffImportSource } from "@/lib/import-source";
import { getAlbum, YupooError } from "@/lib/yupoo";
import { cleanDescription, parseSizes, translateTitle } from "@/lib/yupoo-translate";

// Everything the import needs from one album before it copies the photos.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const auth = await staffImportSource(params.get("source"));
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { owner, password } = auth.source;

  try {
    const album = await getAlbum(owner, password, params.get("id") ?? "");
    const text = `${album.title}\n${album.description}`;
    return NextResponse.json({
      id: album.id,
      title: album.title,
      name: translateTitle(album.title),
      description: cleanDescription(album.description),
      photos: album.photos,
      cover: album.cover,
      sizes: { SHOES: parseSizes(text, "SHOES"), CLOTHING: parseSizes(text, "CLOTHING") },
    });
  } catch (err) {
    const message = err instanceof YupooError ? err.message : "Không đọc được album này.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
