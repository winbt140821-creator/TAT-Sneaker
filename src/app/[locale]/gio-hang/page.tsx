import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { getLiveExchangeRates } from "@/lib/fx";
import { CartView } from "./CartView";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function CartPage() {
  const rates = await getLiveExchangeRates();

  return (
    <>
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={["Giỏ hàng"]} />
        <CartView
          usdExchangeRate={rates.usdExchangeRate}
          cnyExchangeRate={rates.cnyExchangeRate}
        />
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
