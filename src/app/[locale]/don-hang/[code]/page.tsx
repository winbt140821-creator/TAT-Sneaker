import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { Link, redirectGuard } from "@/i18n/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { formatPriceForCurrentLocale } from "@/lib/currency.server";
import { buildVietQrUrl } from "@/lib/vietqr-banks";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { TrackingCodeLink } from "./TrackingCodeLink";
import type { OrderStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { code } = await params;
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session?.user?.email) {
    redirectGuard({ href: `/dang-nhap?callbackUrl=/don-hang/${code}`, locale });
  }

  const [order, t, tCommon, tCheckout, tAccount, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { code },
      include: { items: { include: { product: true } }, customer: true },
    }),
    getTranslations("order"),
    getTranslations("common"),
    getTranslations("checkout"),
    getTranslations("account"),
    getSiteSettings(),
  ]);

  // notFound() rather than a "not your order" message either way — an order
  // that doesn't exist and an order that isn't yours should look identical
  // to the requester, otherwise the response itself confirms the code is
  // valid (an oracle for guessing other customers' codes).
  if (!order || order.customer?.email !== session.user.email) notFound();

  const STATUS_LABEL: Record<OrderStatus, string> = {
    PENDING: t("statusPending"),
    CONFIRMED: t("statusConfirmed"),
    SHIPPED: t("statusShipped"),
    DONE: t("statusDone"),
    CANCELLED: t("statusCancelled"),
  };

  const PAYMENT_METHOD_LABEL: Record<string, string> = {
    COD: t("paymentMethodCod"),
    VNPAY: t("paymentMethodVnpay"),
    PAYPAL: t("paymentMethodPaypal"),
    BANK_TRANSFER: t("paymentMethodBankTransfer"),
  };

  const SYNCED_AT_LOCALE: Record<string, string> = { vi: "vi-VN", en: "en-US", zh: "zh-CN" };
  const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const isFullPayment = order.paymentMethod !== "COD" && order.depositAmount >= total && total > 0;
  const paymentMethodLabel = PAYMENT_METHOD_LABEL[order.paymentMethod] ?? PAYMENT_METHOD_LABEL.COD;
  const fullAddress = order.province && order.ward
    ? `${order.address}, ${order.ward}, ${order.province}`
    : order.address;

  const dynamicBankQrUrl =
    settings?.bankBin && settings?.bankAccountNumber
      ? buildVietQrUrl({
          bin: settings.bankBin,
          accountNumber: settings.bankAccountNumber,
          accountName: settings.bankAccountHolder,
          amount: order.depositAmount,
          addInfo: order.code,
        })
      : null;

  const [itemRows, formattedTotal, formattedDeposit] = await Promise.all([
    Promise.all(
      order.items.map(async (item) => ({
        item,
        lineTotal: await formatPriceForCurrentLocale(item.price * item.quantity),
      }))
    ),
    formatPriceForCurrentLocale(total),
    formatPriceForCurrentLocale(order.depositAmount),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={[t("breadcrumb"), order.code]} />
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <div className="die-cut bg-paper p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-wide text-graphite">
              {t("success")}
            </p>
            <h1 className="mt-2 font-display text-2xl text-ink">{t("orderCode", { code: order.code })}</h1>
            <p className="mt-1 font-mono text-xs text-graphite">
              {t("status")} <span className="text-ink">{STATUS_LABEL[order.status] ?? order.status}</span>
            </p>
            <p className="mt-1 font-mono text-xs text-graphite">
              {t("paymentMethodLabel")} <span className="text-ink">{paymentMethodLabel}</span>
            </p>

            <OrderStatusStepper status={order.status} labels={STATUS_LABEL} />

            {order.trackingCode && (
              <div className="die-cut-flat mt-4 border border-kraft-dark bg-paper p-4">
                <p className="font-mono text-xs uppercase tracking-wide text-graphite">
                  {t("shippingTrackingTitle")}
                </p>
                <p className="mt-1.5 font-mono text-sm text-ink">
                  {t("trackingCode")} <TrackingCodeLink code={order.trackingCode} />
                </p>
                {order.shippingStatus && (
                  <p className="mt-1 font-mono text-xs text-graphite">
                    {t("shippingStatusLabel")}:{" "}
                    <span className="text-ink">
                      {order.shippingStatus.replace(/\s*\(thủ công\)/i, "")}
                    </span>
                  </p>
                )}
                {order.shippingSyncedAt && (
                  <p className="mt-1 font-mono text-[10px] text-graphite">
                    {t("shippingSyncedAt", {
                      time: order.shippingSyncedAt.toLocaleString(SYNCED_AT_LOCALE[locale] ?? "vi-VN"),
                    })}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2 border-t border-kraft-dark pt-4">
              {itemRows.map(({ item, lineTotal }) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink">
                    {item.product.name} — size {item.size} × {item.quantity}
                  </span>
                  <span className="shrink-0 font-mono text-forest">{lineTotal}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-kraft-dark pt-4">
              <span className="font-mono text-sm text-graphite">{t("total")}</span>
              <span className="font-mono text-lg font-semibold text-forest">{formattedTotal}</span>
            </div>

            {order.depositAmount > 0 && (
              <div className="die-cut-flat mt-4 flex items-center justify-between bg-kraft p-4">
                <span className="font-mono text-sm text-graphite">
                  {isFullPayment ? t("depositFullLabel") : t("deposit")}{" "}
                  {order.depositPaid ? t("depositPaid") : t("depositUnpaid")}
                </span>
                <span className="font-mono text-sm font-semibold text-ink">{formattedDeposit}</span>
              </div>
            )}
            {order.depositAmount > 0 && !order.depositPaid && (
              <p className="mt-2 font-mono text-xs text-graphite">
                {order.paymentMethod === "BANK_TRANSFER" ? t("bankTransferPendingTitle") : t("depositNote")}
              </p>
            )}

            {order.paymentMethod === "BANK_TRANSFER" && !order.depositPaid && (
              <div className="die-cut-flat mt-2 flex flex-col gap-1 bg-paper p-4 font-mono text-xs text-ink">
                {settings?.bankName && (
                  <p>{tCheckout("bankNameLabel")}: <span className="font-semibold">{settings.bankName}</span></p>
                )}
                {settings?.bankAccountNumber && (
                  <p>
                    {tCheckout("bankAccountNumberLabel")}:{" "}
                    <span className="font-semibold">{settings.bankAccountNumber}</span>
                  </p>
                )}
                {settings?.bankAccountHolder && (
                  <p>
                    {tCheckout("bankAccountHolderLabel")}:{" "}
                    <span className="font-semibold">{settings.bankAccountHolder}</span>
                  </p>
                )}
                <p>
                  {tCheckout("depositDue")}: <span className="font-semibold">{formattedDeposit}</span>
                </p>
                {dynamicBankQrUrl ? (
                  <div className="mt-2 flex flex-col items-center gap-1.5">
                    <Image
                      src={dynamicBankQrUrl}
                      alt={tCheckout("scanToPay")}
                      width={220}
                      height={220}
                      unoptimized
                      className="h-auto w-full max-w-[220px]"
                    />
                    <p className="text-center text-[11px] text-graphite">{tCheckout("scanToPay")}</p>
                  </div>
                ) : (
                  settings?.bankTransferQrUrl && (
                    <Image
                      src={settings.bankTransferQrUrl}
                      alt={tCheckout("scanToPay")}
                      width={200}
                      height={200}
                      unoptimized
                      className="mt-2 h-auto w-full max-w-[200px]"
                    />
                  )
                )}
                <p className="mt-1 text-[11px] text-graphite">{tCheckout("bankTransferNote")}</p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-1 font-mono text-xs text-graphite sm:grid-cols-2">
              <p>{t("recipient")} <span className="text-ink">{order.customerName}</span></p>
              <p>{t("phone")} <span className="text-ink">{order.customerPhone}</span></p>
              <p className="sm:col-span-2">{t("address")} <span className="text-ink">{fullAddress}</span></p>
              {order.note && <p className="sm:col-span-2">{t("note")} <span className="text-ink">{order.note}</span></p>}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tai-khoan/don-hang"
                className="die-cut-flat inline-block cursor-pointer bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
              >
                {tAccount("navOrders")}
              </Link>
              <Link
                href="/"
                className="die-cut-flat inline-block cursor-pointer border border-graphite px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:border-forest hover:text-forest"
              >
                {tCommon("continueShopping")}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
