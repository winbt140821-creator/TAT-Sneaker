import { cache } from "react";

// Free, keyless FX API (open.er-api.com, the open-source arm of
// exchangerate-api.com) — the single source of truth for every USD/CNY
// price shown on the site (product prices, cart, checkout, PayPal charge
// amount) and for converting a VND order total into what PayPal actually
// charges. No admin-set manual rate exists anymore — see
// getLiveExchangeRates() below.
//
// `next: { revalidate }` is Next.js's own fetch cache, not just a browser
// cache — it's what keeps this from calling the external API on every page
// load. Revalidating hourly also means a brief outage of the FX API is
// invisible to users as long as this route has served at least one
// successful response since the last revalidation window.
const REVALIDATE_SECONDS = 3600;

export type LiveExchangeRates = {
  usdExchangeRate: number | null; // VND per 1 USD
  cnyExchangeRate: number | null; // VND per 1 CNY
};

async function fetchLatestUsdRates(): Promise<Record<string, number> | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    clearTimeout(timeout);
    if (!response.ok) return null;

    const data = (await response.json()) as { result?: string; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) return null;
    return data.rates;
  } catch {
    // Network hiccup, timeout, or malformed response — callers treat a null
    // rate as "unavailable right now" rather than throwing, so a flaky
    // third-party API degrades gracefully instead of breaking checkout or
    // price display outright.
    return null;
  }
}

// Cached per request (React's cache(), same pattern as getSiteSettings()) so
// a single page render that needs both the USD rate and the CNY rate only
// hits the fetch cache once instead of twice.
export const getLiveExchangeRates = cache(async (): Promise<LiveExchangeRates> => {
  const rates = await fetchLatestUsdRates();
  if (!rates) return { usdExchangeRate: null, cnyExchangeRate: null };

  const usdToVnd = rates.VND;
  const usdToCny = rates.CNY;

  return {
    usdExchangeRate: typeof usdToVnd === "number" && usdToVnd > 0 ? usdToVnd : null,
    // Cross-rate through USD: open.er-api.com only publishes rates against
    // a single base currency, so VND-per-CNY = VND-per-USD ÷ CNY-per-USD.
    cnyExchangeRate:
      typeof usdToVnd === "number" && usdToVnd > 0 && typeof usdToCny === "number" && usdToCny > 0
        ? usdToVnd / usdToCny
        : null,
  };
});

export async function getLiveUsdVndRate(): Promise<number | null> {
  return (await getLiveExchangeRates()).usdExchangeRate;
}
