import type { Department } from "@/lib/inventory";

const LABEL: Record<Department, string> = { SHOES: "Giày", CLOTHING: "Quần áo" };

// The one visual cue for "which store is this" across admin: red for the
// shoe store (its brand colour), black for clothing. Used on products,
// orders, categories and the store switch itself, so a glance is enough to
// avoid editing the wrong store.
export const STORE_BADGE_STYLE: Record<Department, string> = {
  SHOES: "bg-forest text-paper",
  CLOTHING: "bg-ink text-paper",
};

export function StoreBadge({ department, className = "" }: { department: Department; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${STORE_BADGE_STYLE[department]} ${className}`}
    >
      {LABEL[department]}
    </span>
  );
}
