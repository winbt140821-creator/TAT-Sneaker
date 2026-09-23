"use client";

import { useState } from "react";
import { SearchIcon, XMarkIcon } from "./icons";
import { SearchBar } from "./SearchBar";

// COS/Zara keep search out of the header until asked for — a single thin
// icon that drops a bare hairline field under the bar, instead of the shoe
// site's always-visible pill.
export function ClothingSearchToggle({
  label,
  usdExchangeRate,
  cnyExchangeRate,
}: {
  label: string;
  usdExchangeRate?: number | null;
  cnyExchangeRate?: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={label}
        className="flex h-10 w-8 cursor-pointer items-center justify-center text-ink transition-opacity hover:opacity-60"
      >
        {open ? <XMarkIcon className="h-[18px] w-[18px]" /> : <SearchIcon className="h-[18px] w-[18px]" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-kraft-dark bg-paper px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl">
            <SearchBar
              id="search-clothing"
              variant="underline"
              autoFocus
              usdExchangeRate={usdExchangeRate}
              cnyExchangeRate={cnyExchangeRate}
            />
          </div>
        </div>
      )}
    </>
  );
}
