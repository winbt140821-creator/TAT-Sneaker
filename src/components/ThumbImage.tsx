"use client";

import { useCallback, useState, type ComponentProps } from "react";
import Image from "next/image";
import { thumbUrl } from "@/lib/image-url";

type Props = Omit<ComponentProps<typeof Image>, "src" | "onError"> & { src: string };

// A product-grid photo served from its small copy (see src/lib/image-url.ts),
// falling back to the full photo if that copy doesn't exist. The fallback
// also covers an error that fired before hydration — React never replays an
// <img> error event that happened before it attached its listener, so the
// ref checks the already-finished image on mount too.
export function ThumbImage({ src, alt, ...rest }: Props) {
  const small = thumbUrl(src);
  const [failed, setFailed] = useState(false);
  const current = failed ? src : small;

  const checkEarlyError = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && small !== src && img.complete && img.naturalWidth === 0) setFailed(true);
    },
    [small, src]
  );

  return (
    <Image
      {...rest}
      ref={failed ? undefined : checkEarlyError}
      src={current}
      alt={alt}
      onError={() => {
        if (!failed && small !== src) setFailed(true);
      }}
    />
  );
}
