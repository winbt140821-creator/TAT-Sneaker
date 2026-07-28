import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { getLiveExchangeRates } from "@/lib/fx";
import { CheckoutForm, type CheckoutDefaultAddress } from "./CheckoutForm";

export const metadata: Metadata = { robots: { index: false, follow: true } };

// Checkout no longer requires an account — guests just add a contact email
// (see CheckoutForm) — but a logged-in session still skips that field and
// snapshots the account email instead, so this page stays a Server
// Component that reads the session rather than gating access on it.
export default async function CheckoutPage() {
  const [session, settings, rates, t] = await Promise.all([
    auth(),
    getSiteSettings(),
    getLiveExchangeRates(),
    getTranslations("checkout"),
  ]);

  // Pre-fill shipping fields from the logged-in customer's default saved
  // address (guests have nothing to pre-fill). Falls back to the most recent
  // address when none is explicitly marked default.
  let defaultAddress: CheckoutDefaultAddress | null = null;
  if (session?.user?.email) {
    const address = await prisma.address.findFirst({
      where: { customer: { email: session.user.email } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    if (address) {
      defaultAddress = {
        fullName: address.fullName,
        phone: address.phone,
        address: address.address,
        province: address.province,
        ward: address.ward,
        country: address.country,
      };
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={[t("breadcrumbCheckout")]} />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <CheckoutForm
            isLoggedIn={Boolean(session?.user)}
            bankName={settings?.bankName}
            bankAccountHolder={settings?.bankAccountHolder}
            bankAccountNumber={settings?.bankAccountNumber}
            bankBin={settings?.bankBin}
            bankTransferQrUrl={settings?.bankTransferQrUrl}
            codOptionTitle={settings?.codOptionTitle}
            codOptionNote={settings?.codOptionNote}
            codOptionZaloPhone={settings?.codOptionZaloPhone}
            holdHours={settings?.autoCancelUnpaidDepositHours}
            defaultAddress={defaultAddress}
            usdExchangeRate={rates.usdExchangeRate}
            cnyExchangeRate={rates.cnyExchangeRate}
          />
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
