"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { UserIcon } from "./icons";
import { signOutCustomerAction } from "@/app/[locale]/actions";

export function AccountMenu({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Tài khoản"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full text-graphite transition-colors hover:text-ink"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <UserIcon className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Tài khoản"
          className="die-cut-flat absolute right-0 top-12 z-50 min-w-44 bg-paper py-1.5 shadow-[var(--shadow-card)]"
        >
          <p className="truncate px-3 py-1.5 font-mono text-xs text-graphite">{name}</p>
          <Link
            role="menuitem"
            href="/tai-khoan"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 font-body text-sm text-ink transition-colors hover:bg-kraft-dark/30"
          >
            Tài khoản của tôi
          </Link>
          <Link
            role="menuitem"
            href="/tai-khoan/don-hang"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 font-body text-sm text-ink transition-colors hover:bg-kraft-dark/30"
          >
            Theo dõi đơn hàng
          </Link>
          <form action={signOutCustomerAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full cursor-pointer px-3 py-1.5 text-left font-body text-sm text-stamp transition-colors hover:bg-kraft-dark/30"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
