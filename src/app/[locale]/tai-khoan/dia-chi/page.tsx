import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AccountShell } from "@/components/account/AccountShell";
import { redirectGuard } from "@/i18n/navigation";
import { getCurrentCustomer } from "@/lib/account";
import { prisma } from "@/lib/db";
import { AddressBookView } from "./AddressBookView";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function AccountAddressesPage() {
  const [customer, locale] = await Promise.all([getCurrentCustomer(), getLocale()]);
  if (!customer) redirectGuard({ href: "/dang-nhap?callbackUrl=/tai-khoan", locale });

  const [t, addresses] = await Promise.all([
    getTranslations("account"),
    prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const addressRows = addresses.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    phone: a.phone,
    company: a.company ?? "",
    address: a.address,
    province: a.province ?? "",
    ward: a.ward ?? "",
    zip: a.zip ?? "",
    isDefault: a.isDefault,
  }));

  return (
    <>
      <Breadcrumb trail={[t("breadcrumb"), t("navAddressesBreadcrumb")]} />
      <AccountShell active="addresses" customerName={customer.name || t("guestName")} addressCount={addresses.length}>
        <AddressBookView addresses={addressRows} />
      </AccountShell>
    </>
  );
}
