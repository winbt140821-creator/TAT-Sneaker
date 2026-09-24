import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getNavCategories } from "@/lib/catalog";
import { getBranding } from "@/lib/settings";
import { getDepartment } from "@/lib/department";
import { getLiveExchangeRates } from "@/lib/fx";
import { BagIcon, UserIcon } from "./icons";
import { MobileCategoryDrawer } from "./MobileCategoryDrawer";
import { CartBadge } from "./CartBadge";
import { AccountMenu } from "./AccountMenu";
import { AdminLinkButton } from "./AdminLinkButton";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { ClothingCategoryNav } from "./ClothingCategoryNav";
import { ClothingSearchToggle } from "./ClothingSearchToggle";
import { StoreSwitch } from "./StoreSwitch";
import { HeaderAutoHide } from "./motion/HeaderAutoHide";

// AccountMenu reads useSearchParams() (to preserve query params when
// switching language) — without a Suspense boundary around it, Next.js
// can't statically prerender any page that renders Header (i.e. every
// customer page), and fails the build outright ("useSearchParams() should
// be wrapped in a suspense boundary"). The fallback mirrors AccountMenu's
// own collapsed-icon appearance so there's no layout shift.
function AccountMenuFallback() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center text-graphite">
      <UserIcon className="h-5 w-5" />
    </div>
  );
}

// Deliberately does NOT call auth()/getCurrentStaff() (both read cookies())
// — that would force every customer page rendering this shared Header to
// skip static rendering/caching just to know the logged-in state. The
// login-dependent bits (AccountMenu, AdminLinkButton) fetch their own state
// client-side instead; see next-intl SessionProvider in
// src/app/[locale]/layout.tsx and src/app/api/admin/session/route.ts.
export async function Header() {
  const department = await getDepartment();
  const [categories, t, branding, rates] = await Promise.all([
    getNavCategories(department),
    getTranslations("header"),
    getBranding(department),
    getLiveExchangeRates(),
  ]);

  if (department === "CLOTHING") {
    // One slim bar, COS-style: wordmark and category text links on the left,
    // three thin icons on the right, a hairline underneath. No search pill,
    // no filled icon circles, no second row.
    return (
      <>
      <StoreSwitch current="CLOTHING" />
      <header
        className="site-header sticky top-0 z-40 border-b border-kraft-dark bg-paper text-ink"
        style={{ viewTransitionName: "site-header" }}
      >
        <HeaderAutoHide />
        <div className="relative flex h-14 items-center gap-6 px-4 sm:px-6 lg:h-[60px] lg:gap-10 lg:px-8">
          <div className="-ml-2 lg:hidden">
            <MobileCategoryDrawer categories={categories} />
          </div>
          <Link
            href="/"
            className="shrink-0 transition-opacity hover:opacity-60"
          >
            <Logo
              logoUrl={branding?.logoUrl}
              department="CLOTHING"
              imageClassName="h-[17px] w-auto max-w-[150px] object-contain sm:h-[22px] sm:max-w-[220px]"
            />
          </Link>

          <ClothingCategoryNav categories={categories} />

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ClothingSearchToggle
              label={t("searchAria")}
              usdExchangeRate={rates.usdExchangeRate}
              cnyExchangeRate={rates.cnyExchangeRate}
            />
            <AdminLinkButton />
            <Suspense fallback={<AccountMenuFallback />}>
              <AccountMenu />
            </Suspense>
            <Link
              href="/gio-hang"
              aria-label={t("cartAria")}
              className="relative flex h-10 w-8 shrink-0 cursor-pointer items-center justify-center text-ink transition-opacity hover:opacity-60"
            >
              <BagIcon className="h-[18px] w-[18px]" />
              <CartBadge />
            </Link>
          </div>
        </div>
      </header>
      </>
    );
  }

  return (
    <>
    <StoreSwitch current="SHOES" />
    <header
      className="site-header sticky top-0 z-40 bg-paper text-ink shadow-[0_1px_0_var(--color-kraft-dark)]"
      style={{ viewTransitionName: "site-header" }}
    >
      <HeaderAutoHide />
      <div className="relative mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <MobileCategoryDrawer categories={categories} />
        <Link
          href="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity hover:opacity-80 sm:static sm:left-auto sm:top-auto sm:min-w-0 sm:flex-1 sm:translate-x-0 sm:translate-y-0"
        >
          <Logo
            logoUrl={branding?.logoUrl}
            imageClassName="h-12 w-auto max-w-[170px] object-contain sm:h-16 sm:max-w-[220px]"
          />
        </Link>

        <div className="hidden max-w-md sm:block">
          <SearchBar
            id="search-desktop"
            usdExchangeRate={rates.usdExchangeRate}
            cnyExchangeRate={rates.cnyExchangeRate}
          />
        </div>

        <div className="flex flex-1 items-center justify-end gap-1">
          <AdminLinkButton />
          <Link
            href="/gio-hang"
            aria-label={t("cartAria")}
            className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-ink-soft"
          >
            <BagIcon className="h-5 w-5" />
            <CartBadge />
          </Link>
          <Suspense fallback={<AccountMenuFallback />}>
            <AccountMenu />
          </Suspense>
        </div>
      </div>

      <div className="border-t border-kraft-dark px-4 py-2 sm:hidden">
        <SearchBar
          id="search-mobile"
          usdExchangeRate={rates.usdExchangeRate}
          cnyExchangeRate={rates.cnyExchangeRate}
        />
      </div>
    </header>
    </>
  );
}
