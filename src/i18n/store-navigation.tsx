"use client";

import { createContext, useContext, useMemo, type ComponentProps, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";
import { storeHref } from "@/lib/store-path";
import type { Department } from "@/lib/inventory";

// Client half of the store-aware navigation re-exported from
// ./navigation.ts. The current store comes from the server (the proxy's
// x-department header, via the root layout) through this context, so every
// Link and router call can keep the shopper inside the store they're in —
// see storeHref() in src/lib/store-path.ts.
const base = createNavigation(routing);

const DepartmentContext = createContext<Department>("SHOES");

export function DepartmentProvider({ department, children }: { department: Department; children: ReactNode }) {
  return <DepartmentContext value={department}>{children}</DepartmentContext>;
}

export function useStoreDepartment(): Department {
  return useContext(DepartmentContext);
}

type BaseHref = ComponentProps<typeof base.Link>["href"];

function resolve<H extends BaseHref>(department: Department, href: H): H {
  if (typeof href === "string") return storeHref(department, href) as H;
  if (href && typeof href === "object" && typeof href.pathname === "string") {
    return { ...href, pathname: storeHref(department, href.pathname) } as H;
  }
  return href;
}

/** URL of a store-agnostic href in another store, locale prefix included —
 *  for full-page navigations that bypass next-intl's Link. */
export function useStoreUrl() {
  const locale = useLocale();
  return (department: Department, href: string) =>
    base.getPathname({ href: storeHref(department, href), locale });
}

/** next-intl's Link, kept inside the current store. Pass `store` to link
 *  into a specific store regardless of the current one (e.g. a cart line for
 *  a product from the other store, or the Giày | Quần áo switch).
 *
 *  A link into the *other* store is a plain <a>, i.e. a full page load, on
 *  purpose: the root layout (which sets the store's theme on <html> and
 *  provides this context) is shared by both stores and is never re-rendered
 *  by a client-side navigation — crossing stores without a reload would
 *  leave the new store wearing the old one's colours and, worse, resolving
 *  every link into the old store. */
export function Link({ href, store, ...rest }: ComponentProps<typeof base.Link> & { store?: Department }) {
  const current = useContext(DepartmentContext);
  const storeUrl = useStoreUrl();
  if (store && store !== current && typeof href === "string") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { prefetch, scroll, replace, locale, ...anchorProps } = rest;
    return <a href={storeUrl(store, href)} {...anchorProps} />;
  }
  return <base.Link href={resolve(store ?? current, href)} {...rest} />;
}

/** Plain next-intl Link with no store rewriting — only for the gateway ("/"). */
export const GatewayLink = base.Link;

export function useRouter() {
  const router = base.useRouter();
  const department = useContext(DepartmentContext);
  return useMemo(
    () => ({
      ...router,
      push: (href: Parameters<typeof router.push>[0], options?: Parameters<typeof router.push>[1]) =>
        router.push(resolve(department, href), options),
      replace: (href: Parameters<typeof router.replace>[0], options?: Parameters<typeof router.replace>[1]) =>
        router.replace(resolve(department, href), options),
      prefetch: (href: Parameters<typeof router.prefetch>[0], options?: Parameters<typeof router.prefetch>[1]) =>
        router.prefetch(resolve(department, href), options),
    }),
    [router, department]
  );
}
