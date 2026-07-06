"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Long descriptions collapse to a fixed height with a fade-out + "Xem thêm"
// toggle instead of always showing the full text — matches the reference
// layout admin asked for. Plain text only (line breaks preserved via
// whitespace-pre-wrap) — admin types their own dashes/blank lines for
// bullets/paragraphs rather than a rich text editor.
const COLLAPSED_MAX_HEIGHT = 192;

export function ProductDescription({ text }: { text: string }) {
  const t = useTranslations("productDetail");
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 400;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
      <h2 className="border-b border-kraft-dark pb-3 font-display text-xl text-ink">
        {t("description")}
      </h2>
      <div
        className="relative mt-4 overflow-hidden"
        style={{ maxHeight: expanded || !isLong ? undefined : COLLAPSED_MAX_HEIGHT }}
      >
        <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-ink">{text}</p>
        {!expanded && isLong && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent"
          />
        )}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 cursor-pointer font-mono text-xs font-semibold uppercase tracking-wide text-forest hover:underline"
        >
          {expanded ? t("descriptionCollapse") : t("descriptionExpand")}
        </button>
      )}
    </div>
  );
}
