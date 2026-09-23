"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AdminStore } from "@/lib/admin-store";

const OPTIONS: { value: AdminStore; label: string; active: string }[] = [
  { value: "ALL", label: "Tất cả", active: "bg-paper text-ink" },
  { value: "SHOES", label: "Giày", active: "bg-forest text-paper" },
  { value: "CLOTHING", label: "Quần áo", active: "bg-ink text-paper ring-1 ring-inset ring-paper/60" },
];

const STOREFRONT: Record<AdminStore, string> = { ALL: "/", SHOES: "/giay", CLOTHING: "/quan-ao" };

// Read server-side by getAdminStore() (src/lib/admin-store.ts).
function rememberStore(value: AdminStore) {
  document.cookie = `admin_store=${value}; path=/admin; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

// The Tất cả | Giày | Quần áo switch pinned to the top of every admin page.
// Remembers the choice in a cookie (read server-side by getAdminStore()),
// then re-renders the current page for the new store. Drops any
// ?department= left in the URL by the per-page tabs, so the page follows
// the switch instead of a stale tab.
export function AdminStoreSwitcher({ store }: { store: AdminStore }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function choose(value: AdminStore) {
    if (value === store) return;
    rememberStore(value);
    const params = new URLSearchParams(window.location.search);
    params.delete("department");
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden font-mono text-[10px] uppercase tracking-wider text-graphite sm:inline">
        Đang quản lý
      </span>
      <div
        role="radiogroup"
        aria-label="Cửa hàng đang quản lý"
        className={"flex border border-graphite/50 " + (pending ? "opacity-60" : "")}
      >
        {OPTIONS.map((o) => {
          const active = o.value === store;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(o.value)}
              className={
                "min-h-9 cursor-pointer px-3 font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors sm:px-4 " +
                (active ? o.active : "text-kraft hover:text-paper")
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <a
        href={STOREFRONT[store]}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto whitespace-nowrap font-mono text-[11px] uppercase tracking-wide text-kraft underline-offset-4 hover:text-paper hover:underline"
      >
        Xem cửa hàng ↗
      </a>
    </div>
  );
}
