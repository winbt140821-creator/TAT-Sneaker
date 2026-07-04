// Client for VNPay's payment gateway (Cổng thanh toán VNPAY).
//
// VNPay merchant onboarding is a business relationship (not public self-serve
// signup) — similar to Viettel Post. Real endpoint URLs, the HMAC-SHA512
// signing secret, and the terminal/merchant code (vnp_TmnCode) are only
// issued once VNPay approves a merchant account, so this module exposes the
// shape callers use (createPaymentUrl / verifyReturnSignature /
// verifyIpnSignature) but throws PaymentNotConfiguredError until then.
//
// To finish this integration once you have merchant credentials:
//   1. Register: https://vnpay.vn/ (merchant/business registration — contact
//      VNPay sales, or via your bank's VNPay partnership program).
//   2. Set VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_PAYMENT_URL (sandbox vs.
//      production endpoint differs) in .env.
//   3. Replace the TODO bodies below with the real HMAC-SHA512 query-string
//      signing per VNPay's integration docs (provided after registration).

export class PaymentNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Chưa cấu hình cổng thanh toán ${provider}. Xem hướng dẫn trong .env.`);
    this.name = "PaymentNotConfiguredError";
  }
}

export interface CreateVnpayPaymentInput {
  orderCode: string; // our Order.code, becomes part of vnp_TxnRef
  amountVnd: number; // deposit or order amount, VND, no decimals
  returnUrl: string; // absolute URL to /api/payments/vnpay/return
  ipAddress: string; // vnp_IpAddr is required by VNPay's spec
  orderInfo: string; // description shown on VNPay's page
}

export interface CreateVnpayPaymentResult {
  paymentUrl: string; // redirect the browser here
  txnRef: string; // our reference, store as Payment.providerRef
}

function requireCredentials() {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  const paymentUrl = process.env.VNPAY_PAYMENT_URL;
  if (!tmnCode || !hashSecret || !paymentUrl) throw new PaymentNotConfiguredError("VNPay");
  return { tmnCode, hashSecret, paymentUrl };
}

// TODO: build the vnp_* query string per VNPay's spec, HMAC-SHA512 sign it
// with hashSecret, append vnp_SecureHash, return the full redirect URL.
export async function createPaymentUrl(
  _input: CreateVnpayPaymentInput,
): Promise<CreateVnpayPaymentResult> {
  requireCredentials();
  throw new Error("createPaymentUrl: chưa triển khai — cần tài liệu tích hợp thật từ VNPay.");
}

// TODO: recompute the HMAC-SHA512 over the returned query params (excluding
// vnp_SecureHash itself) and compare to the provided hash.
export function verifyReturnSignature(_params: URLSearchParams): boolean {
  requireCredentials();
  throw new Error("verifyReturnSignature: chưa triển khai.");
}

// TODO: same signature check as verifyReturnSignature, applied to VNPay's
// server-to-server IPN callback params.
export function verifyIpnSignature(_params: URLSearchParams): boolean {
  requireCredentials();
  throw new Error("verifyIpnSignature: chưa triển khai.");
}
