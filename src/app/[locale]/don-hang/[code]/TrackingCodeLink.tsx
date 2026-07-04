"use client";

import { useState } from "react";

const TRACKING_URL = "https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/";

export function TrackingCodeLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="select-all font-semibold text-ink">{code}</span>
      <button
        type="button"
        onClick={async () => {
          // Kept as its own click (not bundled with the tab-open below) —
          // opening a new tab in the same handler can steal focus before
          // the write lands, which makes Chrome/Firefox silently drop it.
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        className="font-mono text-[10px] font-semibold uppercase tracking-wide text-forest underline decoration-dotted hover:text-forest-dark"
      >
        {copied ? "Đã sao chép!" : "Sao chép"}
      </button>
      <a
        href={TRACKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[10px] font-semibold uppercase tracking-wide text-graphite underline decoration-dotted hover:text-ink"
      >
        Mở trang tra cứu →
      </a>
    </span>
  );
}
