"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { GatewayLink, useStoreUrl } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import styles from "./Gateway.module.css";

type Side = "shoe" | "cloth";

type Labels = {
  heading: string;
  shoesKicker: string;
  shoes: string;
  shoesCta: string;
  clothingKicker: string;
  clothing: string;
  clothingCta: string;
  enter: string;
};

const LANGUAGE_LABEL: Record<string, string> = {
  vi: "VI",
  en: "EN",
  zh: "中文",
};
// How long the chosen side takes to open to full screen before the store
// loads (matches the --split transition in Gateway.module.css).
const OPEN_MS = 650;

export function Gateway({
  shoesImage,
  clothingImage,
  labels,
}: {
  shoesImage: string | null;
  clothingImage: string | null;
  labels: Labels;
}) {
  const locale = useLocale();
  const storeUrl = useStoreUrl();
  const root = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [entering, setEntering] = useState<Side | null>(null);
  const [fine, setFine] = useState(false);

  // Coming back to this page (browser Back) must show both doors again.
  useEffect(() => {
    const reset = () => setEntering(null);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  // Trailing "Vào" disc — real mouse only, skipped entirely on touch screens.
  useEffect(() => {
    const el = root.current;
    const disc = cursor.current;
    if (
      !el ||
      !disc ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    )
      return;
    setFine(true);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0,
      y = 0,
      tx = 0,
      ty = 0,
      raf = 0;
    const tick = () => {
      x += (tx - x) * (still ? 1 : 0.22);
      y += (ty - y) * (still ? 1 : 0.22);
      disc.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf =
        Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3
          ? requestAnimationFrame(tick)
          : 0;
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      const side = (e.target as Element)
        .closest?.("[data-side]")
        ?.getAttribute("data-side");
      if (side && !el.dataset.enter) disc.dataset.side = side;
      else delete disc.dataset.side;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => delete disc.dataset.side;
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Entering a store is a full page load, not a client-side navigation:
  // the root layout (store theme, store-aware links) only renders on a
  // document load — see Link in src/i18n/store-navigation.tsx.
  function enter(side: Side, href: string) {
    return (e: MouseEvent<HTMLAnchorElement>) => {
      // New tab / new window keeps the browser's own behaviour.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      e.preventDefault();
      if (entering) return;
      setEntering(side);
      if (cursor.current) delete cursor.current.dataset.side;
      const still = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.setTimeout(() => window.location.assign(href), still ? 0 : OPEN_MS);
    };
  }

  const plain = !clothingImage;
  const shoesUrl = storeUrl("SHOES", "/");
  const clothingUrl = storeUrl("CLOTHING", "/");

  return (
    <div className={styles.frame}>
      <div
        ref={root}
        className={`${styles.gw} ${fine ? styles.fine : ""}`}
        data-enter={entering ?? undefined}
        data-plain={plain ? "true" : "false"}
      >
        <h1 className={styles.srOnly}>TAT — {labels.heading}</h1>

        <a
          href={shoesUrl}
          data-side="shoe"
          className={`${styles.side} ${styles.shoe}`}
          onClick={enter("shoe", shoesUrl)}
          aria-label={labels.shoesCta}
        >
          {shoesImage && (
            <div className={styles.ph}>
              <Image
                src={shoesImage}
                alt=""
                fill
                priority
                sizes="(max-width: 640px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
          )}
          <div className={styles.cap}>
            <span className={styles.kicker}>{labels.shoesKicker}</span>
            <strong className={styles.title}>{labels.shoes}</strong>
            <span className={styles.go}>
              {labels.shoesCta} <i aria-hidden="true">→</i>
            </span>
          </div>
        </a>

        <a
          href={clothingUrl}
          data-side="cloth"
          className={`${styles.side} ${styles.cloth} ${plain ? styles.plain : ""}`}
          onClick={enter("cloth", clothingUrl)}
          aria-label={labels.clothingCta}
        >
          {clothingImage && (
            <div className={styles.ph}>
              <Image
                src={clothingImage}
                alt=""
                fill
                priority
                sizes="(max-width: 640px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
          )}
          <div className={styles.cap}>
            <span className={styles.kicker}>{labels.clothingKicker}</span>
            <strong className={styles.title}>{labels.clothing}</strong>
            <span className={styles.go}>
              {labels.clothingCta} <i aria-hidden="true">→</i>
            </span>
          </div>
        </a>

        {/* The same three letters twice, each clipped to its own side of the seam. */}
        {[styles.markShoe, styles.markCloth].map((cls) => (
          <div key={cls} className={`${styles.mark} ${cls}`} aria-hidden="true">
            {["T", "A", "T"].map((letter, i) => (
              <span key={i} style={{ "--i": i } as React.CSSProperties}>
                {letter}
              </span>
            ))}
          </div>
        ))}
        <div className={styles.seam} aria-hidden="true">
          <i />
        </div>

        <nav className={styles.topbar} aria-label="Language">
          {routing.locales.map((l) => (
            <GatewayLink
              key={l}
              href="/"
              locale={l}
              aria-current={l === locale ? "true" : undefined}
            >
              {LANGUAGE_LABEL[l] ?? l}
            </GatewayLink>
          ))}
        </nav>

        <div ref={cursor} className={styles.cursor} aria-hidden="true">
          <span>{labels.enter}</span>
        </div>
      </div>
    </div>
  );
}
