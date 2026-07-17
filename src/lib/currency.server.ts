import { getLocale } from "next-intl/server";
import { getLiveExchangeRates } from "./fx";
import { formatPriceForLocale } from "./currency";

// Server Component convenience wrapper — reads the current locale and the
// live exchange rates itself instead of the caller threading them through.
// Kept in a separate module from the pure formatPriceForLocale() so Client
// Components can import that one without pulling in server-only code
// (fetch-with-Next-cache tags can't be bundled for the browser the same way).
export async function formatPriceForCurrentLocale(vnd: number): Promise<string> {
  const [locale, rates] = await Promise.all([getLocale(), getLiveExchangeRates()]);
  return formatPriceForLocale(vnd, locale, rates);
}
