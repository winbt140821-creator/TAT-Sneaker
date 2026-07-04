import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getNavCategories } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";
import { getCurrentStaff } from "@/lib/auth";
import { auth } from "@/auth";
import { BagIcon, DashboardIcon, SearchIcon } from "./icons";
import { MobileCategoryDrawer } from "./MobileCategoryDrawer";
import { CartBadge } from "./CartBadge";
import { AccountMenu } from "./AccountMenu";
import { Logo } from "./Logo";

async function SearchBar({ id }: { id: string }) {
  const t = await getTranslations("header");
  return (
    <form role="search" action="/" className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {t("searchLabel")}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-full border border-kraft-dark bg-kraft py-2 pl-4 pr-11 font-body text-sm text-ink placeholder:text-graphite focus:border-forest focus:bg-paper"
      />
      <button
        type="submit"
        aria-label={t("searchAria")}
        className="absolute right-1 top-1 flex h-[calc(100%-0.5rem)] w-9 cursor-pointer items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-ink-soft"
      >
        <SearchIcon className="h-4 w-4" />
      </button>
    </form>
  );
}

export async function Header() {
  const [categories, session, staff, t, settings] = await Promise.all([
    getNavCategories(),
    auth(),
    getCurrentStaff(),
    getTranslations("header"),
    getSiteSettings(),
  ]);

  return (
    <header
      className="sticky top-0 z-40 bg-paper text-ink shadow-[0_1px_0_var(--color-kraft-dark)]"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="relative mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <MobileCategoryDrawer categories={categories} />
        <Link
          href="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity hover:opacity-80 sm:static sm:left-auto sm:top-auto sm:min-w-0 sm:flex-1 sm:translate-x-0 sm:translate-y-0"
        >
          <Logo logoUrl={settings?.logoUrl} imageClassName="h-12 w-auto max-w-[170px] object-contain sm:h-16 sm:max-w-[220px]" />
        </Link>

        <div className="hidden max-w-md sm:block">
          <SearchBar id="search-desktop" />
        </div>

        <div className="flex flex-1 items-center justify-end gap-1">
          {staff && (
            <NextLink
              href="/admin"
              aria-label={t("adminLinkAria")}
              className="die-cut-flat flex h-10 shrink-0 cursor-pointer items-center gap-1.5 bg-ink px-2.5 text-paper transition-colors hover:bg-ink-soft sm:px-3"
            >
              <DashboardIcon className="h-4 w-4" />
              <span className="hidden font-mono text-xs font-semibold uppercase tracking-wide sm:inline">
                {t("adminLink")}
              </span>
            </NextLink>
          )}
          <Link
            href="/gio-hang"
            aria-label={t("cartAria")}
            className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-ink-soft"
          >
            <BagIcon className="h-5 w-5" />
            <CartBadge />
          </Link>
          <AccountMenu
            session={
              session?.user
                ? { name: session.user.name || session.user.email || t("accountFallback"), avatarUrl: session.user.image }
                : null
            }
          />
        </div>
      </div>

      <div className="border-t border-kraft-dark px-4 py-2 sm:hidden">
        <SearchBar id="search-mobile" />
      </div>
    </header>
  );
}
