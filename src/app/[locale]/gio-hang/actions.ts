"use server";

import { prisma } from "@/lib/db";
import { getActiveCampaigns, salePriceFor } from "@/lib/sale";

export async function getCartProductsAction(ids: string[]) {
  if (ids.length === 0) return [];

  const [products, campaigns] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: ids } } }),
    getActiveCampaigns(),
  ]);

  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    price: salePriceFor(p.id, p.price, campaigns).price,
    images: JSON.parse(p.images) as string[],
    sizeQuantities: JSON.parse(p.sizeQuantities) as Record<string, number>,
    depositRequired: p.depositRequired,
    depositAmount: p.depositAmount,
    availability: p.availability,
    leadTimeMinDays: p.leadTimeMinDays,
    leadTimeMaxDays: p.leadTimeMaxDays,
  }));
}
