import type { ReactNode } from "react";
import { AccountSidebar } from "./AccountSidebar";

export function AccountShell({
  active,
  customerName,
  addressCount,
  children,
}: {
  active: "info" | "orders" | "addresses";
  customerName: string;
  addressCount: number;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <AccountSidebar active={active} customerName={customerName} addressCount={addressCount} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
