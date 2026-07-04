"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { GlobeIcon } from "./icons";

const LOCALE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
};

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function switchTo(nextLocale: string) {
    setOpen(false);
    if (nextLocale === locale) return;
    const query = Object.fromEntries(searchParams.entries());
    router.replace({ pathname, query }, { locale: nextLocale });
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("switcherAria")}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1 rounded-full px-2 font-mono text-xs font-semibold uppercase text-graphite transition-colors hover:text-ink"
      >
        <GlobeIcon className="h-5 w-5" />
        <span className="hidden sm:inline">{locale}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("switcherAria")}
          className="die-cut-flat absolute right-0 top-12 z-50 min-w-36 bg-paper py-1.5 shadow-[var(--shadow-card)]"
        >
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitem"
              aria-current={l === locale ? "true" : undefined}
              onClick={() => switchTo(l)}
              className={
                "block w-full cursor-pointer px-3 py-1.5 text-left font-body text-sm transition-colors hover:bg-kraft-dark/30 " +
                (l === locale ? "text-forest" : "text-ink")
              }
            >
              {LOCALE_LABELS[l] ?? l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
