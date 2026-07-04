"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "./icons";

export function ScrollToTopButton() {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t("scrollToTop")}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-ink text-paper shadow-lg transition-colors hover:bg-ink-soft"
    >
      <ChevronDownIcon className="h-5 w-5 rotate-180" />
    </button>
  );
}
