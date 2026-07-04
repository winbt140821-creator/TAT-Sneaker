"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronDownIcon, FlameIcon, XMarkIcon } from "./icons";

type NavChild = { id: string; label: string; slug: string; hot: boolean };
type NavCategory = {
  id: string;
  label: string;
  slug: string;
  hot: boolean;
  sale: boolean;
  children: NavChild[];
};

export function CategoryNav({
  categories,
  activeCategorySlug,
}: {
  categories: NavCategory[];
  activeCategorySlug?: string;
}) {
  const t = useTranslations("product");
  const [openId, setOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const navRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function toggle(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    const el = triggerRefs.current[id];
    if (el) {
      const rect = el.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, left: rect.left });
    }
    setOpenId(id);
  }

  useEffect(() => {
    if (!openId) return;
    const navEl = navRef.current;

    function close() {
      setOpenId(null);
    }
    function onPointerDown(e: PointerEvent) {
      if (navEl && !navEl.contains(e.target as Node)) close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    navEl?.addEventListener("scroll", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      navEl?.removeEventListener("scroll", close);
    };
  }, [openId]);

  const openCategory = categories.find((c) => c.id === openId);

  return (
    <nav
      ref={navRef}
      className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto py-2 font-mono text-xs uppercase tracking-wider text-kraft [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {categories.map((c) => {
        const isActive = activeCategorySlug === c.slug;
        const isOpen = openId === c.id;

        return (
          <div
            key={c.id}
            ref={(el) => {
              triggerRefs.current[c.id] = el;
            }}
            className="relative shrink-0"
          >
            <div className="flex items-center gap-0.5">
              <Link
                href={`/?category=${encodeURIComponent(c.slug)}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setOpenId(null)}
                className={
                  "flex items-center gap-1 border-b-2 pb-0.5 transition-colors " +
                  (isActive
                    ? c.sale
                      ? "border-stamp text-stamp"
                      : "border-paper text-paper"
                    : "border-transparent " +
                      (c.sale
                        ? "text-stamp hover:border-stamp"
                        : "hover:border-kraft hover:text-paper"))
                }
              >
                {c.label}
                {c.hot && <FlameIcon className="h-3 w-3 text-stamp" />}
                {c.sale && <XMarkIcon className="h-3 w-3 text-stamp" />}
              </Link>

              {c.children.length > 0 && (
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  aria-label={t("subcategoriesOf", { label: c.label })}
                  onClick={() => toggle(c.id)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center text-kraft transition-colors hover:text-paper"
                >
                  <ChevronDownIcon
                    className={
                      "h-3 w-3 transition-transform duration-150 " +
                      (isOpen ? "rotate-180" : "")
                    }
                  />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {openCategory && openCategory.children.length > 0 && (
        <div
          role="menu"
          aria-label={t("subcategoriesOf", { label: openCategory.label })}
          style={{ top: menuPos.top, left: menuPos.left }}
          className="die-cut-flat fixed z-50 min-w-44 bg-paper py-1.5 shadow-[var(--shadow-card)]"
        >
          {openCategory.children.map((child) => (
            <Link
              key={child.id}
              role="menuitem"
              href={`/?category=${encodeURIComponent(child.slug)}`}
              onClick={() => setOpenId(null)}
              className="flex items-center gap-1 px-3 py-1.5 font-body text-sm normal-case tracking-normal text-ink transition-colors hover:bg-kraft-dark/30"
            >
              {child.label}
              {child.hot && <FlameIcon className="h-3 w-3 text-stamp" />}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
