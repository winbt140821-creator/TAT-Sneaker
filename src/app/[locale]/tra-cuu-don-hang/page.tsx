import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { LookupForm } from "./LookupForm";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function OrderLookupPage() {
  const t = await getTranslations("orderLookup");

  return (
    <>
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={[t("breadcrumb")]} />
        <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
          <h1 className="text-center font-display text-2xl italic text-ink">{t("title")}</h1>
          <p className="mt-2 text-center font-mono text-xs text-graphite">{t("description")}</p>
          <LookupForm />
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
