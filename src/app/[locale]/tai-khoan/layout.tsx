import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";

// Each page under this section does its own auth check and redirect (see
// getCurrentCustomer usage in page.tsx / don-hang/page.tsx / dia-chi/page.tsx)
// rather than relying on this layout to gate access — Next.js can render a
// layout and its page concurrently, so a redirect() thrown here doesn't
// reliably stop the page below from also executing with a null customer.
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingActions />
    </>
  );
}
