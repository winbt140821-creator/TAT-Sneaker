"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export function HeroCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (!hasMultiple) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 6000);
    return () => clearInterval(id);
  }, [hasMultiple, images.length]);

  function go(next: number) {
    setIndex((next + images.length) % images.length);
  }

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          quality={90}
          className={
            "object-cover transition-opacity duration-700 ease-out " +
            (i === index ? "opacity-100" : "opacity-0")
          }
        />
      ))}

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-ink/50 text-paper transition-colors hover:bg-ink/70"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Ảnh kế tiếp"
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-ink/50 text-paper transition-colors hover:bg-ink/70"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Ảnh ${i + 1}`}
                onClick={() => go(i)}
                className={
                  "h-1.5 cursor-pointer rounded-full transition-all " +
                  (i === index ? "w-5 bg-forest" : "w-1.5 bg-paper/60 hover:bg-paper")
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
