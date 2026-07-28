// Thin wrapper around Meta's fbq() global — every call is a no-op until
// <MetaPixel> (src/components/MetaPixel.tsx) has loaded the base script,
// which only happens when admin has set SiteSettings.metaPixelId.
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  // eventID lets Meta dedupe this browser-side event against the matching
  // server-side Conversions API event (src/lib/meta-capi.ts) sent for the
  // same order, instead of counting the purchase twice.
  window.fbq("track", event, params, eventId ? { eventID: eventId } : undefined);
}

export function trackViewContent(params: { id: string; name: string; price: number }) {
  track("ViewContent", {
    content_ids: [params.id],
    content_name: params.name,
    content_type: "product",
    value: params.price,
    currency: "VND",
  });
}

export function trackAddToCart(params: { id: string; name: string; price: number; quantity: number }) {
  track("AddToCart", {
    content_ids: [params.id],
    content_name: params.name,
    content_type: "product",
    value: params.price * params.quantity,
    currency: "VND",
  });
}

export function trackInitiateCheckout(params: { value: number; numItems: number }) {
  track("InitiateCheckout", {
    value: params.value,
    currency: "VND",
    num_items: params.numItems,
  });
}

export function trackPurchase(params: { orderCode: string; value: number }) {
  track(
    "Purchase",
    {
      content_ids: [params.orderCode],
      value: params.value,
      currency: "VND",
    },
    params.orderCode
  );
}

// Orders can fire Purchase from two places now — the inline bank-transfer
// panel right after checkout, and the /don-hang confirmation page on any
// (re)visit — so both share this localStorage ledger of already-counted order
// codes to avoid inflating the pixel's Purchase count. Meta still dedupes
// server-side via eventID (see trackPurchase), but this keeps the browser
// event itself from firing twice for the same order.
const PURCHASE_LEDGER_KEY = "meta-pixel-purchases-tracked";

export function trackPurchaseOnce(params: { orderCode: string; value: number }) {
  let tracked: string[] = [];
  try {
    tracked = JSON.parse(localStorage.getItem(PURCHASE_LEDGER_KEY) ?? "[]");
  } catch {
    tracked = [];
  }
  if (tracked.includes(params.orderCode)) return;

  trackPurchase(params);

  try {
    localStorage.setItem(
      PURCHASE_LEDGER_KEY,
      JSON.stringify([...tracked, params.orderCode].slice(-50))
    );
  } catch {
    // localStorage unavailable (private mode, quota) — nothing to do, worst
    // case a revisit fires Purchase again.
  }
}
