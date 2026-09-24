"use client";

import { useCallback, useState } from "react";
import { coverUrl } from "@/lib/image-url";

// A full-width cover photo (homepage covers, gateway panels). Phones get the
// 1280px copy stored next to each uploaded cover (see src/lib/image-url.ts)
// — plenty for a phone screen at 3x — while wide desktop screens still get
// the original. Before this, every phone downloaded the full original: the
// shoe store's cover alone was 1.1MB, and it's the first thing on screen.
// Falls back to the original alone if the 1280px copy doesn't exist.
// Positioned like next/image's `fill` (absolute, covering its parent).
export function CoverImage({
  src,
  alt = "",
  priority = false,
  sizes = "100vw",
  className = "",
}: {
  src: string;
  alt?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const small = coverUrl(src);
  const [failed, setFailed] = useState(false);
  const useSmall = small !== src && !failed;

  const checkEarlyError = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && useSmall && img.complete && img.naturalWidth === 0) setFailed(true);
    },
    [useSmall]
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={checkEarlyError}
      src={src}
      srcSet={useSmall ? `${small} 1280w, ${src} 2400w` : undefined}
      sizes={useSmall ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => {
        if (useSmall) setFailed(true);
      }}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
}
