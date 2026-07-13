"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { UserIcon, HeartIcon } from "./icons";
import { signOutCustomerAction } from "@/app/[locale]/actions";
import {
  getServerWishlistSnapshot,
  getWishlistSnapshot,
  subscribeWishlist,
} from "@/lib/wishlist-storage";

const LOCALE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
};

export function AccountMenu() {
  const { data: authSession } = useSession();
  const tHeader = useTranslations("header");
  const session = authSession?.user
    ? {
        name: authSession.user.name || authSession.user.email || tHeader("accountFallback"),
        avatarUrl: authSession.user.image,
      }
    : null;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const wishlistItems = useSyncExternalStore(
    subscribeWishlist,
    getWishlistSnapshot,
    getServerWishlistSnapshot
  );

  const tLang = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

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

  function switchTo(nextLocale: string) {
    if (nextLocale === locale) return;
    const query = Object.fromEntries(searchParams.entries());
    router.replace({ pathname, query }, { locale: nextLocale });
    setOpen(false);
  }

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
        {session?.avatarUrl ? (
          <Image src={session.avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <UserIcon className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Tài khoản"
          className="die-cut-flat absolute right-0 top-12 z-50 min-w-52 bg-paper py-1.5 shadow-[var(--shadow-card)]"
        >
          {session && (
            <p className="truncate px-3 py-1.5 font-mono text-xs text-graphite">{session.name}</p>
          )}

          <Link
            role="menuitem"
            href="/yeu-thich"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-3 py-1.5 font-body text-sm text-ink transition-colors hover:bg-kraft-dark/30"
          >
            <span className="flex items-center gap-2">
              <HeartIcon className="h-4 w-4" />
              Yêu thích
            </span>
            {wishlistItems.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-stamp px-1 font-mono text-[9px] font-semibold text-paper">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {session ? (
            <>
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
            </>
          ) : (
            <Link
              role="menuitem"
              href="/dang-nhap"
              onClick={() => setOpen(false)}
              className="block px-3 py-1.5 font-body text-sm text-ink transition-colors hover:bg-kraft-dark/30"
            >
              Đăng nhập
            </Link>
          )}

          <div className="my-1 border-t border-kraft-dark" />
          <p className="px-3 pt-1 font-mono text-[10px] uppercase tracking-wide text-graphite">
            {tLang("switcherAria")}
          </p>
          <div className="flex flex-wrap gap-1 px-3 py-1.5">
            {routing.locales.map((l) => (
              <button
                key={l}
                type="button"
                role="menuitemradio"
                aria-checked={l === locale}
                onClick={() => switchTo(l)}
                className={
                  "cursor-pointer rounded-sm px-2 py-1 font-mono text-xs transition-colors " +
                  (l === locale ? "bg-forest text-paper" : "bg-kraft text-ink hover:bg-kraft-dark/50")
                }
              >
                {LOCALE_LABELS[l] ?? l}
              </button>
            ))}
          </div>

          {session && (
            <form action={signOutCustomerAction} className="mt-1 border-t border-kraft-dark pt-1">
              <button
                type="submit"
                role="menuitem"
                className="block w-full cursor-pointer px-3 py-1.5 text-left font-body text-sm text-stamp transition-colors hover:bg-kraft-dark/30"
              >
                Đăng xuất
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
