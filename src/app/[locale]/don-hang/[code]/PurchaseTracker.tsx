"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/meta-pixel";

const STORAGE_KEY = "meta-pixel-purchases-tracked";

// This confirmation page can be revisited any number of times (a customer
// bookmarking it, or checking status later) — track in localStorage which
// order codes already fired Purchase so re-visits don't inflate the count.
export function PurchaseTracker({ orderCode, value }: { orderCode: string; value: number }) {
  useEffect(() => {
    let tracked: string[] = [];
    try {
      tracked = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      tracked = [];
    }
    if (tracked.includes(orderCode)) return;

    trackPurchase({ orderCode, value });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...tracked, orderCode].slice(-50)));
    } catch {
      // localStorage unavailable (private mode, quota) — nothing to do, worst
      // case a revisit fires Purchase again.
    }
  }, [orderCode, value]);

  return null;
}
