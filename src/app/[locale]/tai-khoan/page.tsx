import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AccountShell } from "@/components/account/AccountShell";
import { redirectGuard } from "@/i18n/navigation";
import { getCurrentCustomer } from "@/lib/account";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function AccountInfoPage() {
  const [customer, locale] = await Promise.all([getCurrentCustomer(), getLocale()]);
  if (!customer) redirectGuard({ href: "/dang-nhap?callbackUrl=/tai-khoan", locale });

  const [t, addressCount] = await Promise.all([
    getTranslations("account"),
    prisma.address.count({ where: { customerId: customer.id } }),
  ]);

  return (
    <>
      <Breadcrumb trail={[t("breadcrumb")]} />
      <AccountShell active="info" customerName={customer.name || t("guestName")} addressCount={addressCount}>
        <h2 className="font-display text-xl text-ink">{t("infoTitle")}</h2>
        <div className="die-cut mt-4 flex flex-col gap-3 bg-paper p-5">
          <p className="font-body text-sm text-ink">
            <span className="font-semibold">{t("fullNameLabel")}</span> {customer.name || t("guestName")}
          </p>
          <p className="font-body text-sm text-ink">
            <span className="font-semibold">{t("emailLabel")}</span> {customer.email}
          </p>
        </div>
      </AccountShell>
    </>
  );
}
