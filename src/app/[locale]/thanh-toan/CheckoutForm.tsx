"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import {
  clearCart,
  getCartSnapshot,
  getServerCartSnapshot,
  readCart,
  removeFromCart,
  subscribeCart,
  updateCartQuantity,
} from "@/lib/cart-storage";
import { formatPriceForLocale } from "@/lib/currency";
import { TrashIcon } from "@/components/icons";
import { QuantityStepper } from "@/components/QuantityStepper";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PROVINCES, getWardsByProvinceCode } from "@/lib/vn-locations";
import { getCartProductsAction } from "../gio-hang/actions";
import { createOrderAction, initiatePaymentAction, type PaymentMethod } from "./actions";
import { trackInitiateCheckout } from "@/lib/meta-pixel";

type CartProduct = Awaited<ReturnType<typeof getCartProductsAction>>[number];

// Bank transfer is the only online payment method shown at checkout for now.
// VNPay and the card/PayPal option are both hidden until real gateway
// credentials are set up (see src/lib/payments/*.ts) — the admin QR
// management for them is left in place in Settings in case they come back
// later.

export function CheckoutForm({
  bankName,
  bankAccountHolder,
  usdExchangeRate,
  cnyExchangeRate,
}: {
  bankName?: string | null;
  bankAccountHolder?: string | null;
  usdExchangeRate?: number | null;
  cnyExchangeRate?: number | null;
}) {
  const router = useRouter();
  const locale = useLocale();
  const formatPrice = (vnd: number) =>
    formatPriceForLocale(vnd, locale, { usdExchangeRate, cnyExchangeRate });
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const tActions = useTranslations("productActions");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payInFull, setPayInFull] = useState(false);
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const cartItems = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const isEmpty = cartItems.length === 0;

  const wards = provinceCode ? getWardsByProvinceCode(provinceCode) : [];

  function handleProvinceChange(code: string) {
    setProvinceCode(code);
    setWardCode("");
  }

  const [products, setProducts] = useState<Record<string, CartProduct>>({});
  const idsKey = [...new Set(cartItems.map((i) => i.productId))].sort().join(",");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const ids = idsKey ? idsKey.split(",") : [];
      const found = await getCartProductsAction(ids);
      if (cancelled) return;
      setProducts(Object.fromEntries(found.map((p) => [p.id, p])));
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const summary = cartItems.reduce(
    (acc, item) => {
      const product = products[item.productId];
      if (!product) return acc;
      acc.total += product.price * item.quantity;
      acc.deposit += (product.depositRequired ? (product.depositAmount ?? 0) : 0) * item.quantity;
      acc.maxLeadTime = Math.max(acc.maxLeadTime, product.leadTimeMaxDays);
      return acc;
    },
    { total: 0, deposit: 0, maxLeadTime: 0 }
  );

  const initiateCheckoutFired = useRef(false);
  useEffect(() => {
    if (initiateCheckoutFired.current || cartItems.length === 0 || summary.total === 0) return;
    initiateCheckoutFired.current = true;
    trackInitiateCheckout({ value: summary.total, numItems: cartItems.length });
  }, [cartItems.length, summary.total]);

  // A deposit stays mandatory regardless of the COD/pay-in-full choice —
  // paying in full simply covers it as part of the full amount.
  const needsOnlinePayment = payInFull || summary.deposit > 0;
  const amountDueNow = payInFull ? summary.total : summary.deposit;
  const provider = "BANK_TRANSFER" as const;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const items = readCart();
    const provinceName = PROVINCES.find((p) => p.code === provinceCode)?.name ?? "";
    const wardName = wards.find((w) => w.code === wardCode)?.name ?? "";

    const paymentMethod: PaymentMethod = needsOnlinePayment ? provider : "COD";

    const result = await createOrderAction({
      customerName: String(formData.get("customerName") ?? ""),
      customerPhone: String(formData.get("customerPhone") ?? ""),
      province: provinceName,
      ward: wardName,
      address: String(formData.get("address") ?? ""),
      note: String(formData.get("note") ?? ""),
      items,
      paymentMethod,
      payInFull,
    });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    clearCart();

    if (result.id && result.amountDue) {
      const paymentResult = await initiatePaymentAction(result.id, provider);
      if (paymentResult.redirectUrl) {
        window.location.href = paymentResult.redirectUrl;
        return;
      }
      // BANK_TRANSFER (no redirect — info already shown above) or gateway
      // not configured yet — order is still created, fall through to the
      // confirmation page.
    }

    router.push(`/don-hang/${result.code}`);
  }

  if (isEmpty) {
    return (
      <div>
        <p className="font-mono text-sm text-graphite">{t("emptyCart")}</p>
        <Link
          href="/"
          className="die-cut-flat mt-4 inline-block cursor-pointer bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          {tCommon("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} id="checkout-top" className="flex flex-col gap-8">
      <h1 className="text-center font-display text-3xl italic text-ink">{t("pageTitle")}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="flex flex-col gap-8">
      <div id="shipping-info">
        <h2 className="font-display text-lg uppercase tracking-wide text-ink">
          {t("title")}
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="customerName" className="font-mono text-xs uppercase tracking-wide text-graphite">
              {t("name")}
            </label>
            <input
              id="customerName"
              name="customerName"
              required
              autoComplete="name"
              placeholder={t("name")}
              className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="customerPhone" className="font-mono text-xs uppercase tracking-wide text-graphite">
              {t("phone")}
            </label>
            <input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              required
              autoComplete="tel"
              placeholder={t("phone")}
              className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="provinceCode" className="font-mono text-xs uppercase tracking-wide text-graphite">
              {t("province")}
            </label>
            <SearchableSelect
              id="provinceCode"
              name="provinceCode"
              value={provinceCode}
              onChange={handleProvinceChange}
              options={PROVINCES}
              placeholder={t("provincePlaceholder")}
              searchPlaceholder={t("searchPlaceholder")}
              emptyLabel={t("searchEmptyLabel")}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="wardCode" className="font-mono text-xs uppercase tracking-wide text-graphite">
              {t("ward")}
            </label>
            <SearchableSelect
              id="wardCode"
              name="wardCode"
              value={wardCode}
              onChange={setWardCode}
              options={wards}
              placeholder={t("wardPlaceholder")}
              searchPlaceholder={t("searchPlaceholder")}
              emptyLabel={t("searchEmptyLabel")}
              disabled={!provinceCode}
              required
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="address" className="font-mono text-xs uppercase tracking-wide text-graphite">
            {t("address")}
          </label>
          <input
            id="address"
            name="address"
            required
            autoComplete="street-address"
            placeholder={t("addressDetailPlaceholder")}
            className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
          />
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="note" className="font-mono text-xs uppercase tracking-wide text-graphite">
            {t("note")}
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            placeholder={t("note")}
            className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
          />
        </div>
      </div>

      <div id="payment-info">
        <h2 className="font-display text-lg uppercase tracking-wide text-ink">{t("paymentInfoTitle")}</h2>

        <div className="mt-4">
          <p className="font-mono text-xs uppercase tracking-wide text-graphite">{t("paymentTierTitle")}</p>
          <div className="mt-2 flex flex-col gap-2">
            <label className="flex cursor-pointer flex-col gap-1 border border-graphite bg-paper px-3 py-2.5 has-[:checked]:border-forest has-[:checked]:bg-forest/10">
              <span className="flex items-center gap-2.5 text-sm text-ink">
                <input
                  type="radio"
                  name="payInFullChoice"
                  checked={!payInFull}
                  onChange={() => setPayInFull(false)}
                />
                {t("payCod")}
              </span>
              {summary.deposit > 0 && (
                <p className="ml-6 font-mono text-[11px] text-graphite">
                  {t("depositNoteInline", { amount: formatPrice(summary.deposit) })}
                </p>
              )}
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 border border-graphite bg-paper px-3 py-2.5 text-sm text-ink has-[:checked]:border-forest has-[:checked]:bg-forest/10">
              <input
                type="radio"
                name="payInFullChoice"
                checked={payInFull}
                onChange={() => setPayInFull(true)}
              />
              {t("payInFullOption")}
            </label>
          </div>

          {needsOnlinePayment && (
            <div className="die-cut-flat mt-4 bg-kraft p-3">
              <p className="font-mono text-[11px] uppercase tracking-wide text-graphite">
                {payInFull
                  ? t("payInFullNoteInline", { amount: formatPrice(amountDueNow) })
                  : t("paymentMethod")}
              </p>
              <div className="mt-2 flex flex-col gap-1 font-mono text-xs text-ink">
                {bankName && (
                  <p>
                    {t("bankNameLabel")}: <span className="font-semibold">{bankName}</span>
                  </p>
                )}
                {bankAccountHolder && (
                  <p>
                    {t("bankAccountHolderLabel")}: <span className="font-semibold">{bankAccountHolder}</span>
                  </p>
                )}
                <p className="mt-1 text-[10px] text-graphite">{t("bankTransferQrAfterOrder")}</p>
              </div>

              <p className="mt-3 border-t border-kraft-dark pt-3 font-mono text-[11px] text-graphite">
                {payInFull ? t("payInFullNoteOnline") : t("noteOnline")}
              </p>
            </div>
          )}

          {!needsOnlinePayment && (
            <p className="mt-4 font-mono text-xs text-graphite">{t("noteCod")}</p>
          )}
        </div>
      </div>

      <p className="font-mono text-xs text-graphite">
        {t("privacyNotePrefix")}{" "}
        <Link href="/trang/bao-mat-thong-tin" className="cursor-pointer text-forest underline hover:text-forest-dark">
          {t("privacyNoteLinkLabel")}
        </Link>{" "}
        {t("privacyNoteSuffix")}
      </p>
      </div>

      <div id="your-order" className="lg:sticky lg:top-20">
        <h2 className="font-display text-lg italic text-ink">{t("yourOrder")}</h2>

        <Link
          href="/gio-hang"
          className="die-cut-flat mt-4 inline-flex cursor-pointer items-center gap-1.5 border border-graphite px-4 py-2 font-mono text-xs uppercase tracking-wide text-ink transition-colors hover:border-forest hover:text-forest"
        >
          ← {t("backToCart")}
        </Link>

        <div className="mt-4 flex flex-col gap-3">
          {cartItems.map((item) => {
            const product = products[item.productId];
            if (!product) return null;
            return (
              <div
                key={`${item.productId}-${item.size}`}
                className="die-cut flex flex-wrap items-center gap-3 bg-paper p-3"
              >
                <button
                  type="button"
                  onClick={() => removeFromCart(item.productId, item.size)}
                  aria-label={t("removeItem")}
                  className="shrink-0 cursor-pointer text-graphite transition-colors hover:text-stamp"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-kraft-dark/30">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-mono text-[9px] text-graphite">SKU</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium text-ink">{product.name}</p>
                  <p className="font-mono text-xs text-graphite">
                    {tActions("size")} {item.size}
                  </p>
                  <p className="font-mono text-sm font-semibold text-forest">{formatPrice(product.price)}</p>
                </div>

                <div className="shrink-0">
                  <QuantityStepper
                    quantity={item.quantity}
                    decreaseLabel={tActions("decreaseQty")}
                    increaseLabel={tActions("increaseQty")}
                    onDecrease={() => updateCartQuantity(item.productId, item.size, item.quantity - 1)}
                    onIncrease={() => updateCartQuantity(item.productId, item.size, item.quantity + 1)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="die-cut mt-4 flex flex-col gap-2 bg-paper p-4">
          <div className="flex items-center justify-between font-mono text-sm">
            <span className="text-graphite">{t("itemsCount")}</span>
            <span className="font-semibold text-ink">{cartItems.length}</span>
          </div>
          <div className="flex items-center justify-between border-t border-kraft-dark pt-2 font-mono text-sm">
            <span className="text-graphite">{t("subtotal")}</span>
            <span className="font-semibold text-ink">{formatPrice(summary.total)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-kraft-dark pt-2 font-mono text-sm">
            <span className="text-graphite">{t("shipmentLabel")}</span>
            <span className="font-semibold text-ink">{t("freeShipping")}</span>
          </div>
          {summary.deposit > 0 && !payInFull && (
            <div className="flex items-center justify-between border-t border-kraft-dark pt-2 font-mono text-sm">
              <span className="text-graphite">{t("depositDue")}</span>
              <span className="font-semibold text-ink">{formatPrice(summary.deposit)}</span>
            </div>
          )}
          {summary.maxLeadTime > 0 && (
            <p className="font-mono text-xs text-graphite">{t("leadTime", { days: summary.maxLeadTime })}</p>
          )}
          <div className="flex items-center justify-between border-t border-kraft-dark pt-3">
            <span className="font-display text-base text-ink">{t("total")}</span>
            <span className="font-display text-xl text-forest">{formatPrice(summary.total)}</span>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 font-mono text-xs text-stamp">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full cursor-pointer bg-forest px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </div>
      </div>
    </form>
  );
}
