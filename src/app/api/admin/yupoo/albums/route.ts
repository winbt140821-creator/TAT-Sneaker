import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { staffImportSource } from "@/lib/import-source";
import { albumUrl, listAlbums, YupooError } from "@/lib/yupoo";
import { translateTitle } from "@/lib/yupoo-translate";

// One page of a supplier's albums for the import screen, each with its
// Vietnamese name and whether it's already a product here.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const auth = await staffImportSource(params.get("source"));
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { owner, password } = auth.source;

  try {
    const page = Math.max(1, Math.min(500, Number(params.get("page")) || 1));
    const result = await listAlbums(owner, password, {
      page,
      categoryId: params.get("category") || undefined,
      q: params.get("q")?.trim().slice(0, 100) || undefined,
    });
    const urls = result.albums.map((a) => albumUrl(owner, a.id));
    const existing = await prisma.product.findMany({
      where: { sourceUrl: { in: urls } },
      select: { id: true, sourceUrl: true },
    });
    const productByUrl = new Map(existing.map((p) => [p.sourceUrl, p.id]));
    return NextResponse.json({
      ...result,
      page,
      albums: result.albums.map((a) => ({
        ...a,
        name: translateTitle(a.title),
        productId: productByUrl.get(albumUrl(owner, a.id)) ?? null,
      })),
    });
  } catch (err) {
    const message = err instanceof YupooError ? err.message : "Không đọc được shop Yupoo này.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
