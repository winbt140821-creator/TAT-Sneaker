import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { getLiveExchangeRates } from "@/lib/fx";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function WishlistPage() {
  const rates = await getLiveExchangeRates();

  return (
    <>
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={["Yêu thích"]} />
        <WishlistView
          usdExchangeRate={rates.usdExchangeRate}
          cnyExchangeRate={rates.cnyExchangeRate}
        />
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
