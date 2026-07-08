import { createHash } from "crypto";
import { getSiteSettings } from "./settings";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// Meta expects digits only, country code included, no leading '+'. Checkout
// only collects Vietnamese phone numbers, so a leading "0" is swapped for
// the "84" country code; anything already given with a country code is left
// as-is.
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `84${digits.slice(1)}` : digits;
}

type PurchaseEventInput = {
  orderCode: string;
  value: number;
  email?: string | null;
  phone?: string | null;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
};

/** Sends a Purchase event to Meta's Conversions API — a server-side
 *  complement to the browser Pixel's trackPurchase() (src/lib/meta-pixel.ts)
 *  for when SiteSettings has both a Pixel ID and a Conversions API access
 *  token configured (Events Manager > Cài đặt > API Chuyển đổi > Tạo mã
 *  thông báo truy cập). Uses the order code as the event_id so Meta dedupes
 *  this against the same order's client-side Purchase event instead of
 *  double-counting revenue. Never throws — ad tracking must never break
 *  checkout. */
export async function sendCapiPurchase(input: PurchaseEventInput): Promise<void> {
  try {
    const settings = await getSiteSettings();
    if (!settings?.metaPixelId || !settings?.metaCapiAccessToken) return;

    const userData: Record<string, unknown> = {};
    if (input.email) userData.em = [sha256(input.email)];
    if (input.phone) userData.ph = [sha256(normalizePhone(input.phone))];
    if (input.clientIp) userData.client_ip_address = input.clientIp;
    if (input.userAgent) userData.client_user_agent = input.userAgent;
    if (input.fbp) userData.fbp = input.fbp;
    if (input.fbc) userData.fbc = input.fbc;

    const body = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: input.orderCode,
          action_source: "website",
          event_source_url: input.eventSourceUrl,
          user_data: userData,
          custom_data: {
            currency: "VND",
            value: input.value,
            content_ids: [input.orderCode],
          },
        },
      ],
    };

    await fetch(
      `https://graph.facebook.com/v21.0/${settings.metaPixelId}/events?access_token=${encodeURIComponent(
        settings.metaCapiAccessToken
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
  } catch {
    // Best-effort — a failed/slow Meta API call must never fail checkout.
  }
}
