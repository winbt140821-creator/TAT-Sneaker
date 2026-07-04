import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AccountShell } from "@/components/account/AccountShell";
import { Link, redirectGuard } from "@/i18n/navigation";
import { getCurrentCustomer } from "@/lib/account";
import { prisma } from "@/lib/db";
import { formatPriceForCurrentLocale } from "@/lib/currency.server";

export const metadata: Metadata = { robots: { index: false, follow: true } };

const DATE_LOCALE: Record<string, string> = { vi: "vi-VN", en: "en-US", zh: "zh-CN" };

export default async function AccountOrdersPage() {
  const [customer, locale] = await Promise.all([getCurrentCustomer(), getLocale()]);
  if (!customer) redirectGuard({ href: "/dang-nhap?callbackUrl=/tai-khoan", locale });

  const [t, tCommon, addressCount, orders] = await Promise.all([
    getTranslations("account"),
    getTranslations("common"),
    prisma.address.count({ where: { customerId: customer.id } }),
    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  const orderRows = await Promise.all(
    orders.map(async (order) => {
      const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const isFullPayment = order.paymentMethod !== "COD" && order.depositAmount >= total && total > 0;
      const paymentStatus =
        order.paymentMethod === "COD"
          ? t("paymentStatusCod")
          : order.depositPaid
            ? isFullPayment
              ? t("paymentStatusPaid")
              : t("paymentStatusDepositPaid")
            : t("paymentStatusPending");
      const fullAddress = order.province && order.ward
        ? `${order.address}, ${order.ward}, ${order.province}`
        : order.address;

      return {
        order,
        total: await formatPriceForCurrentLocale(total),
        paymentStatus,
        fullAddress,
        date: order.createdAt.toLocaleDateString(DATE_LOCALE[locale] ?? "vi-VN"),
      };
    })
  );

  return (
    <>
      <Breadcrumb trail={[t("breadcrumb"), t("navOrders")]} />
      <AccountShell active="orders" customerName={customer.name || t("guestName")} addressCount={addressCount}>
        <h2 className="font-display text-xl text-ink">{t("navOrders")}</h2>

        {orderRows.length === 0 ? (
          <div className="die-cut-flat mt-4 bg-kraft p-6 text-center">
            <p className="font-mono text-sm text-graphite">{t("noOrders")}</p>
            <Link
              href="/"
              className="die-cut-flat mt-4 inline-block cursor-pointer bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
            >
              {tCommon("continueShopping")}
            </Link>
          </div>
        ) : (
          <div className="die-cut mt-4 overflow-x-auto bg-paper">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-kraft-dark bg-kraft">
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-graphite">{t("colOrder")}</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-graphite">{t("colDate")}</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-graphite">{t("colAddress")}</th>
                  <th className="px-4 py-3 text-right font-mono text-xs uppercase tracking-wide text-graphite">{t("colTotal")}</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-graphite">{t("colPaymentStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.map(({ order, total, paymentStatus, fullAddress, date }) => (
                  <tr key={order.id} className="border-b border-kraft-dark last:border-0">
                    <td className="px-4 py-3 font-mono text-sm">
                      <Link href={`/don-hang/${order.code}`} className="text-forest hover:underline">
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-graphite">{date}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-body text-sm text-ink" title={fullAddress}>
                      {fullAddress}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-forest">{total}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink">{paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AccountShell>
    </>
  );
}
