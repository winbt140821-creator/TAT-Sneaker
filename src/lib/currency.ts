import { formatPrice } from "./products";

export type ExchangeRates = {
  usdExchangeRate?: number | null;
  cnyExchangeRate?: number | null;
};

// Which non-default locale displays which currency. "vi" isn't listed —
// it always shows VNĐ (the real transactional currency, COD).
const CURRENCY_BY_LOCALE: Record<string, "USD" | "CNY"> = {
  en: "USD",
  zh: "CNY",
};

const INTL_LOCALE: Record<"USD" | "CNY", string> = {
  USD: "en-US",
  CNY: "zh-CN",
};

// Pure/sync, no server-only imports — safe in both Server and Client
// Components once locale and rates are already known (rates come from
// admin-set SiteSettings fields, passed down as props in Client Components).
// Falls back to VNĐ when the locale has no mapped currency or the admin
// hasn't set a rate for it yet, rather than showing a broken/zero price.
export function formatPriceForLocale(
  vnd: number,
  locale: string,
  rates: ExchangeRates
): string {
  const currency = CURRENCY_BY_LOCALE[locale];
  if (!currency) return formatPrice(vnd);

  const rate = currency === "USD" ? rates.usdExchangeRate : rates.cnyExchangeRate;
  if (!rate) return formatPrice(vnd);

  const converted = vnd / rate;
  return new Intl.NumberFormat(INTL_LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(converted);
}
