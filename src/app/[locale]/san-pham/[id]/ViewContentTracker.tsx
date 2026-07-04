"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/meta-pixel";

export function ViewContentTracker({
  id,
  name,
  price,
}: {
  id: string;
  name: string;
  price: number;
}) {
  useEffect(() => {
    trackViewContent({ id, name, price });
    // Only ever needs to fire once per page view, not on every re-render
    // (e.g. a size selection re-rendering a sibling client component).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return null;
}
