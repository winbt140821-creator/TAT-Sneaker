// Client for PayPal's Orders API v2 (Checkout).
//
// PayPal does not settle in VND — all PayPal charges must be in USD,
// converted from the VND order/deposit amount using a live market rate
// (see src/lib/fx.ts).
//
// Setup:
//   1. Register: https://developer.paypal.com/ (free developer account) ->
//      create a REST app to get a Client ID + Secret (sandbox first, then
//      live/production credentials after PayPal business account review).
//   2. Set PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE
//      (https://api-m.sandbox.paypal.com vs. https://api-m.paypal.com) in .env.
//   3. In the developer dashboard, add a webhook pointing at
//      /api/payments/paypal/webhook subscribed to PAYMENT.CAPTURE.COMPLETED,
//      and set its id as PAYPAL_WEBHOOK_ID (required for signature checks).

export class PaymentNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Chưa cấu hình cổng thanh toán ${provider}. Xem hướng dẫn trong .env.`);
    this.name = "PaymentNotConfiguredError";
  }
}

export interface CreatePaypalOrderInput {
  orderCode: string;
  amountUsd: number; // already converted from VND using the admin-set rate, in USD cents
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatePaypalOrderResult {
  approveUrl: string; // redirect the browser here
  paypalOrderId: string; // store as Payment.providerRef
}

export interface CapturePaypalOrderResult {
  status: string;
  captureId: string;
}

function requireCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const apiBase = process.env.PAYPAL_API_BASE;
  if (!clientId || !clientSecret || !apiBase) throw new PaymentNotConfiguredError("PayPal");
  return { clientId, clientSecret, apiBase };
}

// Access tokens are valid for hours; cache per process to avoid an extra
// round-trip on every checkout. The 60s margin keeps a token from expiring
// mid-request.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, apiBase } = requireCredentials();

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) {
    throw new Error(`PayPal OAuth thất bại (HTTP ${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

async function paypalFetch(path: string, init: { method: string; body?: unknown; requestId?: string }) {
  const { apiBase } = requireCredentials();
  const token = await getAccessToken();
  return fetch(`${apiBase}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Idempotency key — a retried call (e.g. double-submit) returns the
      // same PayPal order instead of creating a duplicate charge attempt.
      ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

export async function createOrder(input: CreatePaypalOrderInput): Promise<CreatePaypalOrderResult> {
  const response = await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    requestId: `order-${input.orderCode}`,
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderCode,
          custom_id: input.orderCode,
          amount: {
            currency_code: "USD",
            value: (input.amountUsd / 100).toFixed(2),
          },
        },
      ],
      // No payment_source.paypal here on purpose: setting it forces the
      // PayPal-branded button flow only. application_context instead keeps
      // PayPal's standard hosted checkout, which also offers a "Debit or
      // Credit Card" guest option (no PayPal account needed) at the bottom
      // of the login page, letting the same integration serve both PayPal
      // and card payments.
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    },
  });
  if (!response.ok) {
    throw new Error(`PayPal tạo đơn thất bại (HTTP ${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as {
    id: string;
    links?: { rel: string; href: string }[];
  };
  const approveUrl = data.links?.find((l) => l.rel === "approve")?.href;
  if (!approveUrl) {
    throw new Error(`PayPal không trả về link thanh toán cho đơn ${input.orderCode}.`);
  }

  return { approveUrl, paypalOrderId: data.id };
}

type PaypalOrderResponse = {
  status: string;
  purchase_units?: {
    payments?: { captures?: { id: string; status: string }[] };
  }[];
};

function extractCapture(order: PaypalOrderResponse): CapturePaypalOrderResult {
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    // A COMPLETED order whose capture is still PENDING (e.g. under review)
    // must not be treated as paid — report the capture's own status when
    // one exists.
    status: capture?.status ?? order.status,
    captureId: capture?.id ?? "",
  };
}

export async function captureOrder(paypalOrderId: string): Promise<CapturePaypalOrderResult> {
  const response = await paypalFetch(`/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    requestId: `capture-${paypalOrderId}`,
    body: {},
  });

  if (response.ok) {
    return extractCapture((await response.json()) as PaypalOrderResponse);
  }

  // The webhook and the browser-return capture can race; the loser gets
  // ORDER_ALREADY_CAPTURED. That's a success from our point of view — fetch
  // the order to report the real capture status.
  const errorBody = await response.text();
  if (response.status === 422 && errorBody.includes("ORDER_ALREADY_CAPTURED")) {
    const orderResponse = await paypalFetch(`/v2/checkout/orders/${paypalOrderId}`, { method: "GET" });
    if (orderResponse.ok) {
      return extractCapture((await orderResponse.json()) as PaypalOrderResponse);
    }
  }

  throw new Error(`PayPal capture thất bại (HTTP ${response.status}): ${errorBody}`);
}

export async function verifyWebhookSignature(headers: Headers, body: string): Promise<boolean> {
  requireCredentials();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new PaymentNotConfiguredError("PayPal (thiếu PAYPAL_WEBHOOK_ID)");

  let event: unknown;
  try {
    event = JSON.parse(body);
  } catch {
    return false;
  }

  const response = await paypalFetch("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: {
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event,
    },
  });
  if (!response.ok) return false;

  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}
