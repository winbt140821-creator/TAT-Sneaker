"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShareIcon } from "@/components/icons";

// Uses the native share sheet on mobile/supported browsers (lets the
// customer pick Messenger, Zalo, Facebook, etc. directly); falls back to
// copying the link to the clipboard on desktop browsers without it, with a
// brief inline confirmation instead of a toast system this page doesn't have.
export function ShareButton({ productName }: { productName: string }) {
  const t = useTranslations("productActions");
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: productName, url });
      } catch {
        // User cancelled the share sheet — not an error worth surfacing.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (very old browser, insecure context) —
      // nothing else reasonable to fall back to.
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={handleShare}
        aria-label={t("share")}
        className="die-cut-flat flex h-11 w-11 cursor-pointer items-center justify-center border border-kraft-dark text-graphite transition-colors hover:border-forest hover:text-forest"
      >
        <ShareIcon className="h-5 w-5" />
      </button>
      {copied && (
        <p
          role="status"
          className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-ink px-2.5 py-1.5 font-mono text-[11px] text-paper"
        >
          {t("shareCopied")}
        </p>
      )}
    </div>
  );
}
