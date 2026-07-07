import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { auth } from "@/auth";
import { getSiteSettings } from "@/lib/settings";
import { redirectGuard } from "@/i18n/navigation";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function CheckoutPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session?.user) {
    redirectGuard({ href: "/dang-nhap?callbackUrl=/thanh-toan", locale });
  }

  const [settings, t] = await Promise.all([getSiteSettings(), getTranslations("checkout")]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={[t("breadcrumbCheckout")]} />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <CheckoutForm
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
