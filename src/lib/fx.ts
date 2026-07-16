// Free, keyless FX API (open.er-api.com, the open-source arm of
// exchangerate-api.com) — used to convert a VND order total into the USD
// amount PayPal actually charges, so the price the customer sees at PayPal
// tracks the real market rate instead of drifting from whatever an admin
// last typed into Settings. Rates refresh roughly daily on their end.
export async function getLiveUsdVndRate(): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;

    const data = (await response.json()) as { result?: string; rates?: Record<string, number> };
    if (data.result !== "success") return null;

    const rate = data.rates?.VND;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    // Network hiccup, timeout, or malformed response — caller falls back to
    // the admin-set rate, so a flaky third-party API must never block
    // checkout.
    return null;
  }
}
