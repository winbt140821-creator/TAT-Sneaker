// Client for PayPal's Orders API v2 (Checkout).
//
// PayPal supports self-serve developer signup (unlike VNPay/Viettel Post),
// but this module still stubs the real calls out since no credentials exist
// yet in this project. PayPal does not settle in VND — all PayPal charges
// must be in USD, converted from the VND order/deposit amount using
// SiteSettings.usdExchangeRate (admin-set fixed rate, edited in
// /admin/settings).
//
// To finish this integration:
//   1. Register: https://developer.paypal.com/ (free developer account) ->
//      create a REST app to get a Client ID + Secret (sandbox first, then
//      live/production credentials after PayPal business account review).
//   2. Set PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE
//      (https://api-m.sandbox.paypal.com vs. https://api-m.paypal.com) in .env.
//   3. Replace the TODO bodies below with real calls to PayPal's Orders v2
//      API (POST /v2/checkout/orders to create, POST
//      /v2/checkout/orders/{id}/capture to capture) using an OAuth2
//      client-credentials token obtained via POST /v1/oauth2/token.

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

// TODO: obtain an OAuth2 token, POST /v2/checkout/orders with intent
// CAPTURE and amount.currency_code = "USD", return the "approve" link from
// the response.
export async function createOrder(_input: CreatePaypalOrderInput): Promise<CreatePaypalOrderResult> {
  requireCredentials();
  throw new Error("createOrder: chưa triển khai — cần thiết lập PayPal REST app thật.");
}

// TODO: POST /v2/checkout/orders/{paypalOrderId}/capture, return capture id + status.
export async function captureOrder(_paypalOrderId: string): Promise<CapturePaypalOrderResult> {
  requireCredentials();
  throw new Error("captureOrder: chưa triển khai.");
}

// TODO: verify via POST /v1/notifications/verify-webhook-signature.
export async function verifyWebhookSignature(_headers: Headers, _body: string): Promise<boolean> {
  requireCredentials();
  throw new Error("verifyWebhookSignature: chưa triển khai.");
}
