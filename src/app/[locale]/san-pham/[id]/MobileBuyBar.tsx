"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Department } from "@/lib/inventory";

type SizeOption = { size: string; disabled: boolean };

// Phones only (hidden from lg up, where the purchase column sits pinned
// beside the photos). While the page's own size picker and buttons are off
// screen — looking at photos, reading the description — a slim bar stays at
// the bottom with the price and one button:
// - no size picked yet: the button opens a sheet sliding up from the bottom
//   with the sizes, and adding from there;
// - size picked: the button adds straight to the bag.
// Tucks away over the footer, and above the shoe store's fixed contact bar.
export function MobileBuyBar({
  anchor,
  department,
  productName,
  priceLabel,
  sizes,
  selectedSize,
  onPickSize,
  onAdd,
  added,
  labels,
}: {
  anchor: RefObject<HTMLElement | null>;
  department: Department;
  productName: string;
  priceLabel: string;
  sizes: SizeOption[];
  selectedSize: string | null;
  onPickSize: (size: string) => void;
  onAdd: () => void;
  added: boolean;
  labels: { chooseSize: string; addToCart: string; added: string; close: string };
}) {
  const [anchorVisible, setAnchorVisible] = useState(true);
  const [footerVisible, setFooterVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = anchor.current;
    const footer = document.querySelector("footer");
    if (!target || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === target) setAnchorVisible(e.isIntersecting);
        else setFooterVisible(e.isIntersecting);
      }
    });
    io.observe(target);
    if (footer) io.observe(footer);
    return () => io.disconnect();
  }, [anchor]);

  // Escape closes the sheet; focus moves into it when it opens.
  useEffect(() => {
    if (!sheetOpen) return;
    sheetRef.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  const show = (!anchorVisible && !footerVisible) || sheetOpen;
  const barUp = show && !sheetOpen;

  // Lets the shoe store's floating scroll-to-top button step up out of the
  // bar's way (see .floating-actions in globals.css).
  useEffect(() => {
    document.body.dataset.buybar = barUp ? "on" : "off";
    return () => {
      delete document.body.dataset.buybar;
    };
  }, [barUp]);
  const clothing = department === "CLOTHING";
  // The shoe store keeps a fixed contact bar along the bottom on phones.
  const offset = clothing ? "bottom-0" : "bottom-14 sm:bottom-0";

  function mainAction() {
    if (selectedSize) onAdd();
    else setSheetOpen(true);
  }

  function addFromSheet() {
    if (!selectedSize) return;
    onAdd();
    setSheetOpen(false);
  }

  return (
    <div className="lg:hidden">
      <div
        aria-hidden="true"
        onClick={() => setSheetOpen(false)}
        className={
          "fixed inset-0 z-40 bg-ink/40 transition-opacity duration-300 " +
          (sheetOpen ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={labels.chooseSize}
        inert={!sheetOpen}
        className={
          `fixed inset-x-0 ${offset} z-50 border-t border-kraft-dark bg-paper px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ` +
          (sheetOpen ? "translate-y-0" : "translate-y-[calc(100%+4rem)]")
        }
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-kraft-dark" aria-hidden="true" />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink">{labels.chooseSize}</p>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="-mr-2 min-h-11 cursor-pointer px-2 text-[12px] text-graphite hover:text-ink"
          >
            {labels.close}
          </button>
        </div>
        <ul className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {sizes.map(({ size, disabled }) => {
            const selected = size === selectedSize;
            return (
              <li key={size}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => onPickSize(size)}
                  className={
                    "flex h-12 w-full items-center justify-center border text-[14px] transition-colors " +
                    (disabled
                      ? "cursor-not-allowed border-kraft-dark text-graphite/50 line-through"
                      : selected
                        ? "cursor-pointer border-ink bg-ink text-paper"
                        : "cursor-pointer border-kraft-dark text-ink")
                  }
                >
                  {size}
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={addFromSheet}
          disabled={!selectedSize}
          className="press mt-4 flex h-12 w-full cursor-pointer items-center justify-center bg-ink text-[12px] font-medium uppercase tracking-[0.16em] text-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          {labels.addToCart}
        </button>
      </div>

      <div
        inert={!show || sheetOpen}
        className={
          `fixed inset-x-0 ${offset} z-30 border-t border-kraft-dark bg-paper px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ` +
          (barUp ? "translate-y-0" : "translate-y-[calc(100%+4rem)]")
        }
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-ink">{productName}</p>
            <p className={clothing ? "text-[13px] text-ink" : "font-mono text-sm font-bold text-forest"}>
              {priceLabel}
              {selectedSize && <span className="ml-2 font-body text-[12px] font-normal text-graphite">Size {selectedSize}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={mainAction}
            data-added={added}
            className="press flex h-11 shrink-0 cursor-pointer items-center justify-center bg-ink px-5 text-[11px] font-medium uppercase tracking-[0.14em] text-paper"
          >
            {selectedSize ? (
              <span className="label-swap">
                <span>{labels.addToCart}</span>
                <span aria-hidden="true">{labels.added} ✓</span>
              </span>
            ) : (
              labels.chooseSize
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
