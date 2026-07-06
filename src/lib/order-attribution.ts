// Shared across the admin orders list/detail pages — turns the raw
// utm_source/utm_medium/utm_campaign/fbclid snapshot (captured by
// src/proxy.ts, saved onto the order at checkout) into a short label so
// staff can see which ad/campaign drove a sale without leaving the site.
export function attributionLabel(order: {
  utmSource: string | null;
  utmCampaign: string | null;
  fbclid: string | null;
}): string | null {
  if (order.utmSource) {
    return order.utmCampaign ? `${order.utmSource} · ${order.utmCampaign}` : order.utmSource;
  }
  if (order.fbclid) return "Facebook/Instagram Ads";
  return null;
}
