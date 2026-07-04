"use server";

import { prisma } from "@/lib/db";

export async function getCartProductsAction(ids: string[]) {
  if (ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
  });

  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    price: p.price,
    images: JSON.parse(p.images) as string[],
    sizeQuantities: JSON.parse(p.sizeQuantities) as Record<string, number>,
    depositRequired: p.depositRequired,
    depositAmount: p.depositAmount,
    availability: p.availability,
    leadTimeMinDays: p.leadTimeMinDays,
    leadTimeMaxDays: p.leadTimeMaxDays,
  }));
}
