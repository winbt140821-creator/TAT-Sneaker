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

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    return response.ok ? await response.json() : null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fromOpenErApi(): Promise<Record<string, number> | null> {
  const data = (await fetchJson("https://open.er-api.com/v6/latest/USD")) as {
    result?: string;
    rates?: Record<string, number>;
  } | null;
  return data?.result === "success" && data.rates ? data.rates : null;
}

// Second, independent source (fawazahmed0/exchange-api, served from the
// jsDelivr CDN): used only when open.er-api.com fails. Without it, an
// outage of that one API right after a deploy (empty fetch cache) meant
// international/PayPal checkout couldn't be completed at all, since there
// is no manual fallback rate. Keys come back lowercase ("vnd"), so they're
// upper-cased to match the primary source's shape.
async function fromCurrencyApi(): Promise<Record<string, number> | null> {
  const data = (await fetchJson(
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
  )) as { usd?: Record<string, number> } | null;
  if (!data?.usd) return null;
  return Object.fromEntries(Object.entries(data.usd).map(([k, v]) => [k.toUpperCase(), v]));
}

async function fetchLatestUsdRates(): Promise<Record<string, number> | null> {
  for (const source of [fromOpenErApi, fromCurrencyApi]) {
    try {
      const rates = await source();
      if (rates && typeof rates.VND === "number" && rates.VND > 0) return rates;
    } catch {
      // Network hiccup, timeout, or malformed response — try the next
      // source. Callers treat a null rate as "unavailable right now" rather
      // than throwing, so a flaky third-party API degrades gracefully
      // instead of breaking checkout or price display outright.
    }
  }
  return null;
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
