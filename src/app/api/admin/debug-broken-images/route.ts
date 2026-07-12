import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Temporary staff-only diagnostic: list every product whose first image is a
// leftover relative /uploads/... path from before R2 was configured — those
// files never existed on Vercel's serverless filesystem, so next/image 404s
// on them. Delete once the affected products have had photos re-uploaded.
export async function GET() {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, images: true },
    take: 10,
  });

  const sample = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    images: JSON.parse(p.images || "[]") as string[],
  }));

  return NextResponse.json({ totalProducts: products.length, sample });
}
