"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

// Root layout hardcodes <html lang="vi"> (see src/app/layout.tsx for why —
// reading the real locale there via next-intl's getLocale() forced every
// customer page to skip static rendering). This corrects it client-side for
// en/zh visitors instead, without touching server rendering at all.
export function HtmlLangSync() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
