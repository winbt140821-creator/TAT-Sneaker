"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatPriceForLocale } from "@/lib/currency";
import { SearchIcon } from "./icons";
import { defaultSuggestionsAction, searchSuggestionsAction, type SearchSuggestion } from "./search-actions";

// Debounced type-ahead: shows up to 5 matching products (thumbnail + name +
// price) while the customer types, so they don't have to submit the form and
// land on a results page just to see if something exists.
const DEBOUNCE_MS = 250;

export function SearchBar({
  id,
  usdExchangeRate,
  cnyExchangeRate,
}: {
  id: string;
  usdExchangeRate?: number | null;
  cnyExchangeRate?: number | null;
}) {
  const t = useTranslations("header");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[] | null>(null);
  const [showingDefaults, setShowingDefaults] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const formatPrice = (vnd: number) =>
    formatPriceForLocale(vnd, locale, { usdExchangeRate, cnyExchangeRate });

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // Cleared back to empty while still focused — fall back to the same
      // default suggestions shown on focus, instead of leaving stale
      // search-match results in place.
      if (open) {
        defaultSuggestionsAction().then((found) => {
          setResults(found);
          setShowingDefaults(true);
        });
      }
      return;
    }

    const timer = setTimeout(async () => {
      const found = await searchSuggestionsAction(trimmed);
      setResults(found);
      setShowingDefaults(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, open]);

  // Suggestions appear the instant the box is focused, before typing
  // anything — the effect above fetches default suggestions whenever `open`
  // flips true with an empty query, live matches take over once typing
  // starts.
  function handleFocus() {
    setOpen(true);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToProduct(productId: string) {
    setOpen(false);
    router.push(`/san-pham/${productId}`);
  }

  const showDropdown = open;

  return (
    <div ref={containerRef} className="relative w-full">
      <form role="search" action="/">
        <label htmlFor={id} className="sr-only">
          {t("searchLabel")}
        </label>
        <input
          id={id}
          name="q"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-full border border-kraft-dark bg-kraft py-2 pl-4 pr-11 font-body text-sm text-ink placeholder:text-graphite focus:border-forest focus:bg-paper"
        />
        <button
          type="submit"
          aria-label={t("searchAria")}
          className="absolute right-1 top-1 flex h-[calc(100%-0.5rem)] w-9 cursor-pointer items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-ink-soft"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </form>

      {showDropdown && (
        <div className="die-cut absolute left-0 right-0 top-full z-50 mt-1.5 max-h-96 overflow-y-auto bg-paper py-1.5 shadow-lg">
          {results === null && (
            <p className="px-4 py-3 font-mono text-xs text-graphite">…</p>
          )}
          {results !== null && results.length === 0 && (
            <p className="px-4 py-3 font-mono text-xs text-graphite">{t("searchNoResults")}</p>
          )}
          {results !== null && results.length > 0 && showingDefaults && (
            <p className="px-4 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-wide text-graphite">
              {t("searchSuggestedHeading")}
            </p>
          )}
          {results?.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => goToProduct(r.id)}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-kraft"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-kraft-dark/30">
                {r.image ? (
                  <Image src={r.image} alt="" width={40} height={40} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-mono text-[8px] text-graphite">SKU</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm text-ink">{r.name}</p>
                <p className="font-mono text-xs font-semibold text-forest">{formatPrice(r.price)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
