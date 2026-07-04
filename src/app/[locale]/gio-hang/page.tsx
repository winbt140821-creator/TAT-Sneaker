import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { getSiteSettings } from "@/lib/settings";
import { CartView } from "./CartView";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function CartPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={["Giỏ hàng"]} />
        <CartView
          usdExchangeRate={settings?.usdExchangeRate}
          cnyExchangeRate={settings?.cnyExchangeRate}
        />
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
