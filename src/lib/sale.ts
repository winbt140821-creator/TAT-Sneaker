import { cache } from "react";
import { prisma } from "./db";

// Active campaigns are read once per request and reused everywhere a price
// is displayed or charged (catalog, cart, checkout snapshot) — toggling a
// campaign in admin takes effect instantly without touching Product rows.
export const getActiveCampaigns = cache(() => {
  return prisma.saleCampaign.findMany({
    where: { active: true },
    include: { products: { select: { id: true } } },
  });
});

export type ActiveCampaigns = Awaited<ReturnType<typeof getActiveCampaigns>>;

function bestDiscountPercent(productId: string, campaigns: ActiveCampaigns) {
  let best = 0;
  for (const c of campaigns) {
    if (c.discountPercent > best && (c.appliesToAll || c.products.some((p) => p.id === productId))) {
      best = c.discountPercent;
    }
  }
  return best;
}

/** Applies the best matching active campaign discount to a base price,
 *  returning the same { price, originalPrice } shape the old manually-set
 *  originalPrice field used to produce — so existing display code
 *  (ProductCard, PDP, WishlistView, getDiscountPct) needs no changes. */
export function salePriceFor(productId: string, basePrice: number, campaigns: ActiveCampaigns) {
  const pct = bestDiscountPercent(productId, campaigns);
  if (!pct) return { price: basePrice, originalPrice: null as number | null };
  const discounted = Math.round((basePrice * (1 - pct / 100)) / 1000) * 1000;
  return { price: discounted, originalPrice: basePrice };
}

/** Product ids affected by any active campaign — "ALL" means every product
 *  (some active campaign applies to all), used by the SALE category filter. */
export function saleProductIds(campaigns: ActiveCampaigns): string[] | "ALL" {
  if (campaigns.some((c) => c.appliesToAll)) return "ALL";
  const ids = new Set<string>();
  for (const c of campaigns) for (const p of c.products) ids.add(p.id);
  return [...ids];
}
