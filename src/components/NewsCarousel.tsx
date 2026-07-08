"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  publishedAtLabel: string;
};

export function NewsCarousel({ items }: { items: NewsItem[] }) {
  const t = useTranslations("news");
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCards(direction: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <article key={item.id} className="die-cut w-64 shrink-0 bg-paper sm:w-72">
            <div className="relative aspect-[4/3] bg-kraft-dark/30">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(min-width: 640px) 288px, 256px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-wide text-graphite">
                  {t("noImage")}
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 font-body text-sm font-medium leading-snug text-ink">
                {item.title}
              </h3>
              <p className="mt-1 font-mono text-[10px] text-graphite">{item.publishedAtLabel}</p>
              <p className="mt-1.5 line-clamp-2 font-body text-xs text-graphite">{item.excerpt}</p>
            </div>
          </article>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label={t("prev")}
            onClick={() => scrollByCards(-1)}
            className="absolute -left-3 top-[35%] hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-paper text-ink shadow-[var(--shadow-card)] transition-colors hover:bg-kraft sm:flex"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={t("next")}
            onClick={() => scrollByCards(1)}
            className="absolute -right-3 top-[35%] hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-paper text-ink shadow-[var(--shadow-card)] transition-colors hover:bg-kraft sm:flex"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
