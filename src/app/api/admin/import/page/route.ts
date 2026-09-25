import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isStaffRequest } from "@/lib/staff-api";
import { readWebPage, WebImportError } from "@/lib/web-import";
import { hasChinese } from "@/lib/image-source-url";
import { parseSizes, translateTitle } from "@/lib/yupoo-translate";

// Reads a pasted link from any shop: one product (with its photos, a name
// ready to use, and sizes for each store) or a list of products to pick
// from — each marked if it's already a product here.
export const maxDuration = 60;

function nameFor(title: string) {
  return hasChinese(title) ? translateTitle(title) : title;
}

export async function GET(request: NextRequest) {
  if (!(await isStaffRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = request.nextUrl.searchParams.get("url") ?? "";

  try {
    const page = await readWebPage(url);
    if (page.kind === "product") {
      const p = page.product;
      const existing = await prisma.product.findFirst({ where: { sourceUrl: p.url }, select: { id: true } });
      const text = `${p.title}\n${p.sizeText}\n${p.description}`;
      return NextResponse.json({
        kind: "product",
        product: {
          ...p,
          name: nameFor(p.title),
          sizes: { SHOES: parseSizes(text, "SHOES"), CLOTHING: parseSizes(text, "CLOTHING") },
          productId: existing?.id ?? null,
        },
      });
    }
    const existing = await prisma.product.findMany({
      where: { sourceUrl: { in: page.items.map((i) => i.url) } },
      select: { id: true, sourceUrl: true },
    });
    const byUrl = new Map(existing.map((p) => [p.sourceUrl, p.id]));
    return NextResponse.json({
      ...page,
      items: page.items.map((i) => ({ ...i, name: nameFor(i.title), productId: byUrl.get(i.url) ?? null })),
    });
  } catch (err) {
    const message = err instanceof WebImportError ? err.message : "Không đọc được trang này.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
