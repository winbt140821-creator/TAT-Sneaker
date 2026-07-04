"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ALL_SIZES } from "@/lib/inventory";
import { ChevronDownIcon, FilterIcon } from "./icons";

type Availability = "IN_STOCK" | "PREORDER";

function buildQuery(current: URLSearchParams, patch: Record<string, string | null>) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  return next.toString();
}

export function Toolbar({
  from,
  to,
  total,
}: {
  from: number;
  to: number;
  total: number;
}) {
  const t = useTranslations("toolbar");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const sort = searchParams.get("sort") ?? "popularity";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const size = searchParams.get("size");
  const availability = searchParams.get("availability") as Availability | null;

  const activeFilterCount =
    (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (size ? 1 : 0) + (availability ? 1 : 0);

  function applyPatch(patch: Record<string, string | null>) {
    const qs = buildQuery(searchParams, patch);
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 pt-2 sm:px-6" id="products">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-graphite">
          {t("showing")} <span className="font-semibold text-ink">{from}–{to}</span> {t("of")} {total} {t("results")}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="die-cut-flat flex cursor-pointer items-center gap-1.5 bg-paper px-3 py-1.5 font-mono text-xs text-ink hover:border-forest"
          >
            <FilterIcon className="h-3.5 w-3.5" />
            {t("filterLabel")}
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-forest font-mono text-[10px] text-paper">
                {activeFilterCount}
              </span>
            )}
          </button>

          <label className="flex items-center gap-2 font-mono text-xs text-graphite">
            {t("sortLabel")}
            <span className="relative">
              <select
                value={sort}
                onChange={(e) => applyPatch({ sort: e.target.value === "popularity" ? null : e.target.value })}
                className="die-cut-flat cursor-pointer appearance-none bg-paper py-1.5 pl-2 pr-7 text-ink"
              >
                <option value="popularity">{t("sortPopularity")}</option>
                <option value="newest">{t("sortNewest")}</option>
                <option value="price-asc">{t("sortPriceAsc")}</option>
                <option value="price-desc">{t("sortPriceDesc")}</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite" />
            </span>
          </label>
        </div>
      </div>

      {open && (
        <div className="die-cut mt-3 flex flex-col gap-5 bg-paper p-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-graphite">{t("filterPriceLabel")}</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={t("filterPriceMin")}
                defaultValue={minPrice}
                onBlur={(e) => applyPatch({ minPrice: e.target.value || null })}
                className="w-24 border border-graphite bg-paper px-2 py-1.5 font-mono text-xs text-ink focus:border-forest"
              />
              <span className="text-graphite">–</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={t("filterPriceMax")}
                defaultValue={maxPrice}
                onBlur={(e) => applyPatch({ maxPrice: e.target.value || null })}
                className="w-24 border border-graphite bg-paper px-2 py-1.5 font-mono text-xs text-ink focus:border-forest"
              />
            </div>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-graphite">{t("filterSizeLabel")}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {ALL_SIZES.map((s) => {
                const isSelected = size === String(s);
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => applyPatch({ size: isSelected ? null : String(s) })}
                      aria-pressed={isSelected}
                      className={
                        "flex h-8 w-8 items-center justify-center border font-mono text-xs transition-colors " +
                        (isSelected
                          ? "cursor-pointer border-forest bg-forest text-paper"
                          : "cursor-pointer border-kraft-dark text-ink hover:border-forest")
                      }
                    >
                      {s}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-graphite">{t("filterAvailabilityLabel")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(
                [
                  { value: null, label: t("filterAll") },
                  { value: "IN_STOCK" as Availability, label: t("filterInStock") },
                  { value: "PREORDER" as Availability, label: t("filterPreorder") },
                ]
              ).map((opt) => {
                const isSelected = availability === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => applyPatch({ availability: opt.value })}
                    aria-pressed={isSelected}
                    className={
                      "die-cut-flat cursor-pointer px-3 py-1.5 font-mono text-xs transition-colors " +
                      (isSelected ? "border-forest bg-forest/10 text-forest" : "text-ink hover:border-forest")
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => applyPatch({ minPrice: null, maxPrice: null, size: null, availability: null })}
              className="cursor-pointer self-start font-mono text-xs uppercase tracking-wide text-graphite underline hover:text-stamp sm:mt-5"
            >
              {t("filterClear")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
