"use client";

import { useState } from "react";

type Currency = "VND" | "USD" | "CNY";

// Admin mostly sources stock from China, so cost/sale prices need to be
// enterable in CNY/USD too — but Product.price and Product.costPrice are
// always stored in VND. This converts on the fly using the same admin-set
// exchange rates already used to display prices in USD/CNY to customers
// (SiteSettings.usdExchangeRate/cnyExchangeRate), and submits only the
// converted VND amount via a hidden input.
export function PriceInputWithCurrency({
  id,
  name,
  label,
  hint,
  required,
  defaultValueVnd,
  usdExchangeRate,
  cnyExchangeRate,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  defaultValueVnd?: number | null;
  usdExchangeRate?: number | null;
  cnyExchangeRate?: number | null;
}) {
  const [currency, setCurrency] = useState<Currency>("VND");
  const [amount, setAmount] = useState(defaultValueVnd != null ? String(defaultValueVnd) : "");

  const rateFor = (c: Currency) => (c === "USD" ? usdExchangeRate : c === "CNY" ? cnyExchangeRate : 1);

  function toVnd(value: string, c: Currency): number {
    const n = Number(value);
    if (!value || Number.isNaN(n)) return 0;
    const rate = rateFor(c);
    return rate ? Math.round(n * rate) : 0;
  }

  function handleCurrencyChange(next: Currency) {
    const vnd = toVnd(amount, currency);
    const nextRate = rateFor(next);
    if (vnd && nextRate) setAmount(String(Math.round((vnd / nextRate) * 100) / 100));
    setCurrency(next);
  }

  const vndValue = toVnd(amount, currency);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-wide text-graphite">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="number"
          min={0}
          step="any"
          required={required}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="min-w-0 flex-1 border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
        />
        <select
          value={currency}
          onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
          aria-label={`Đơn vị tiền tệ cho ${label}`}
          className="border border-graphite bg-paper px-2 py-2 font-mono text-xs uppercase text-ink focus:border-forest"
        >
          <option value="VND">VNĐ</option>
          <option value="USD" disabled={!usdExchangeRate}>USD</option>
          <option value="CNY" disabled={!cnyExchangeRate}>CNY</option>
        </select>
      </div>
      {currency !== "VND" && (
        <p className="font-mono text-[11px] text-graphite">≈ {vndValue.toLocaleString("vi-VN")}đ</p>
      )}
      {hint && <p className="font-mono text-[11px] text-graphite">{hint}</p>}
      <input type="hidden" name={name} value={vndValue} />
    </div>
  );
}
