"use client";

import { useState } from "react";

export function CopyShipmentInfoButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="die-cut-flat w-full cursor-pointer bg-paper px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-kraft-dark/30"
    >
      {copied ? "Đã sao chép!" : "Sao chép thông tin đơn hàng"}
    </button>
  );
}
