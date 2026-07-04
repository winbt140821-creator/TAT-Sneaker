"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, XMarkIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { logoutAction } from "../actions";

type NavItem = { href: string; label: string; adminOnly?: boolean };
type NavGroup = { label: string; items: NavItem[] };

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar({
  navGroups,
  staffName,
  staffRoleLabel,
  logoUrl,
}: {
  navGroups: NavGroup[];
  staffName: string;
  staffRoleLabel: string;
  logoUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes (nav link tapped). Adjusting
  // state during render instead of an effect — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b-4 border-forest bg-ink px-4 py-3 sm:hidden">
        <Link href="/" className="inline-block">
          <Logo
            logoUrl={logoUrl}
            imageClassName="h-8 w-auto max-w-[140px] object-contain"
            brandVariant="light"
          />
        </Link>
        <button
          type="button"
          aria-label={open ? "Đóng menu quản trị" : "Mở menu quản trị"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center text-paper"
        >
          {open ? <XMarkIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
        />
      )}

      <aside
        className={
          "z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r-4 border-forest bg-ink text-paper transition-transform duration-200 sm:static sm:w-56 sm:translate-x-0 " +
          (open ? "fixed inset-y-0 left-0 translate-x-0" : "fixed inset-y-0 left-0 -translate-x-full sm:flex")
        }
      >
        <div className="hidden px-5 py-5 sm:block">
          <Link href="/" className="inline-block">
            <Logo
              logoUrl={logoUrl}
              imageClassName="h-8 w-auto max-w-[140px] object-contain"
              brandVariant="light"
            />
          </Link>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-graphite">
            Quản trị
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-4 px-3 pt-4 sm:pt-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2.5 pb-1 font-mono text-[10px] uppercase tracking-wider text-graphite">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={
                        "rounded-sm px-2.5 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors " +
                        (active
                          ? "bg-forest text-paper"
                          : "text-kraft hover:bg-ink-soft hover:text-paper")
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-graphite/40 px-5 py-4">
          <p className="truncate font-body text-sm text-paper">{staffName}</p>
          <p className="truncate font-mono text-[10px] uppercase tracking-wide text-graphite">
            {staffRoleLabel}
          </p>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="w-full cursor-pointer border border-graphite px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-kraft transition-colors hover:border-stamp hover:text-stamp"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
