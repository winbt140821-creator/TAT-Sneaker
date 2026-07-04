"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@/components/icons";
import { SneakerArt, silhouetteFor } from "@/components/SneakerArt";

export function ProductGallery({
  images,
  name,
  accent,
  fallbackIndex,
}: {
  images: string[];
  name: string;
  accent: string;
  fallbackIndex: number;
}) {
  const t = useTranslations("productDetail");
  const [active, setActive] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [zoomOpen, setZoomOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="die-cut flex aspect-square items-center justify-center bg-kraft-dark/30 p-10">
        <SneakerArt
          silhouette={silhouetteFor(fallbackIndex)}
          accent={accent}
          className="h-full w-full"
        />
      </div>
    );
  }

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div>
      <div
        className="die-cut group relative aspect-square cursor-zoom-in overflow-hidden bg-kraft-dark/30"
        onMouseMove={handleMouseMove}
        onClick={() => setZoomOpen(true)}
      >
        <Image
          src={images[active]}
          alt={name}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
        {/* Desktop hover magnifier — a second copy of the image, scaled up and
            panned to follow the cursor. Hidden on touch devices (no hover) via
            group-hover, which only fires on pointers that support it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:block"
          style={{
            backgroundImage: `url(${images[active]})`,
            backgroundSize: "200%",
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            backgroundRepeat: "no-repeat",
          }}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label={t("galleryPrev")}
              onClick={(e) => {
                e.stopPropagation();
                setActive((i) => (i - 1 + images.length) % images.length);
              }}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm transition-colors hover:bg-paper"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={t("galleryNext")}
              onClick={(e) => {
                e.stopPropagation();
                setActive((i) => (i + 1) % images.length);
              }}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm transition-colors hover:bg-paper"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t("galleryView", { index: i + 1 })}
              aria-current={active === i}
              className={
                "die-cut-flat aspect-square cursor-pointer overflow-hidden transition-colors " +
                (active === i ? "border-forest" : "hover:border-graphite")
              }
            >
              <Image src={src} alt="" width={80} height={80} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("galleryZoomIn")}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-ink/90 p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            aria-label={t("galleryZoomClose")}
            onClick={() => setZoomOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-paper/90 text-ink hover:bg-paper"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <div className="relative h-full max-h-[90vh] w-full max-w-3xl">
            <Image
              src={images[active]}
              alt={name}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
