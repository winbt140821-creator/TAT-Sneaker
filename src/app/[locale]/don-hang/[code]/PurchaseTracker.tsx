"use client";

import { useEffect } from "react";
import { trackPurchaseOnce } from "@/lib/meta-pixel";

// This confirmation page can be revisited any number of times (a customer
// bookmarking it, or checking status later) — trackPurchaseOnce keeps a
// localStorage ledger of already-counted order codes so re-visits (and the
// inline bank-transfer panel that also fires Purchase for the same order)
// don't inflate the count.
export function PurchaseTracker({ orderCode, value }: { orderCode: string; value: number }) {
  useEffect(() => {
    trackPurchaseOnce({ orderCode, value });
  }, [orderCode, value]);

  return null;
}
