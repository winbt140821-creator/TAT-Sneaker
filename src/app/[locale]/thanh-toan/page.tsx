import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { auth } from "@/auth";
import { getSiteSettings } from "@/lib/settings";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { robots: { index: false, follow: true } };

// Checkout no longer requires an account — guests just add a contact email
// (see CheckoutForm) — but a logged-in session still skips that field and
// snapshots the account email instead, so this page stays a Server
// Component that reads the session rather than gating access on it.
export default async function CheckoutPage() {
  const [session, settings, t] = await Promise.all([
    auth(),
    getSiteSettings(),
    getTranslations("checkout"),
  ]);

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
            usdExchangeRate={settings?.usdExchangeRate}
            cnyExchangeRate={settings?.cnyExchangeRate}
          />
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
