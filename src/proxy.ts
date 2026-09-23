import { NextResponse, NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { splitStorePrefix, STORE_PREFIX } from "@/lib/store-path";
import type { Department } from "@/lib/inventory";

const intlMiddleware = createIntlMiddleware(routing);

// First-ever visit only (no saved language preference yet): default the
// locale from the visitor's country — Vercel's edge network sets this
// header automatically in production; it's absent in local dev, which is
// fine, detection then just falls through to next-intl's normal
// Accept-Language/defaultLocale behavior.
//
// VN -> vi, the Chinese-speaking cluster -> zh, everyone else -> en.
const ZH_COUNTRIES = new Set(["CN", "TW", "HK", "MO", "SG"]);

function detectLocaleFromCountry(
  country: string | null
): (typeof routing.locales)[number] | undefined {
  if (!country) return undefined;
  const cc = country.toUpperCase();
  if (cc === "VN") return "vi";
  if (ZH_COUNTRIES.has(cc)) return "zh";
  return "en";
}

// Last-touch ad attribution: whenever a landing page URL carries any of
// these params (a Facebook/Google ad click, a UTM-tagged link...), snapshot
// them into a cookie that createOrderAction (src/app/[locale]/thanh-toan/
// actions.ts) reads at checkout — so admin can see which campaign drove a
// sale directly on the order, not just in Ads Manager. A later visit with
// new params overwrites the cookie (last touch wins); a visit with none
// leaves whatever's already stored alone.
function captureAttribution(request: NextRequest, res: NextResponse) {
  const params = request.nextUrl.searchParams;
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const fbclid = params.get("fbclid");
  if (!utmSource && !fbclid) return;

  const trim = (v: string | null) => v?.slice(0, 200);
  res.cookies.set(
    "attribution",
    JSON.stringify({
      utmSource: trim(utmSource),
      utmMedium: trim(utmMedium),
      utmCampaign: trim(utmCampaign),
      fbclid: trim(fbclid),
    }),
    { maxAge: 60 * 60 * 24 * 30 }
  );
}

// Copies the incoming request's headers plus x-department — passed to
// NextResponse.next()/rewrite()'s `request` option so Server Components can
// read it via next/headers (src/lib/department.ts), and fed to next-intl's
// own middleware, which forwards whatever headers the request it receives
// already carries.
function departmentHeaders(request: NextRequest, department: Department): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-department", department);
  return requestHeaders;
}

// Ad/campaign parameters only. A bare tatsneaker.vn link carrying just these
// (e.g. an old Facebook ad) still lands on the gateway; any other parameter
// on "/" is an old shoe-catalog link (?category=, ?q=, ?page=...) from
// before the shoe homepage moved to /giay, and follows it there.
const TRACKING_PARAM = /^(utm_\w+|fbclid|gclid|ttclid|_gl|ref)$/;

// The gateway is served from its own internal route; "/" is its only public
// address.
const GATEWAY_ROUTE = "/cua-ngo";

type StoreRoute = {
  department: Department;
  /** Path the route tree actually serves, e.g. "/en/san-pham/x" for "/en/quan-ao/san-pham/x". */
  internal: string;
  /** Puts a store-less path (as next-intl redirects to) back under this request's store. */
  restore: (storeless: string) => string;
};

// Works out which store a customer URL belongs to — see src/lib/store-path.ts
// for the URL scheme. Returns a Response instead when the URL itself should
// change (old catalog links, non-canonical addresses).
function routeStore(request: NextRequest): StoreRoute | NextResponse {
  const { pathname, searchParams } = request.nextUrl;
  const first = pathname.split("/")[1];
  const localePrefix = (routing.locales as readonly string[]).includes(first) ? `/${first}` : "";
  const rest = pathname.slice(localePrefix.length) || "/";
  const join = (lp: string, p: string) => (lp + (p === "/" ? "" : p)) || "/";
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url, 308);
  };
  const { department: prefixed, rest: inner } = splitStorePrefix(rest);

  if (prefixed === "CLOTHING") {
    return {
      department: "CLOTHING",
      internal: join(localePrefix, inner),
      restore: (p) => {
        const lp = localeOf(p);
        const r = p.slice(lp.length) || "/";
        return join(lp, STORE_PREFIX.CLOTHING + (r === "/" ? "" : r));
      },
    };
  }

  if (prefixed === "SHOES") {
    // Only the shoe homepage lives under /giay; every other shoe page kept
    // its original unprefixed URL, so /giay/san-pham/x is folded back onto
    // /san-pham/x rather than serving the same page at two addresses.
    if (inner !== "/") return redirectTo(join(localePrefix, inner));
    return {
      department: "SHOES",
      internal: join(localePrefix, "/"),
      restore: (p) => join(localeOf(p), STORE_PREFIX.SHOES),
    };
  }

  if (rest === GATEWAY_ROUTE) return redirectTo(join(localePrefix, "/"));

  if (rest === "/") {
    const hasCatalogParams = [...searchParams.keys()].some((k) => !TRACKING_PARAM.test(k));
    if (hasCatalogParams) return redirectTo(join(localePrefix, STORE_PREFIX.SHOES));
    return {
      department: "SHOES",
      internal: join(localePrefix, GATEWAY_ROUTE),
      restore: (p) => join(localeOf(p), "/"),
    };
  }

  return { department: "SHOES", internal: pathname, restore: (p) => p };
}

function localeOf(path: string): string {
  const first = path.split("/")[1];
  return (routing.locales as readonly string[]).includes(first) ? `/${first}` : "";
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The clothing store briefly had its own subdomain before both stores
  // moved under one domain — send anything still pointing there to its
  // new address.
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("quanao.")) {
    const target = new URL(`https://${host.slice("quanao.".length)}`);
    target.pathname = `${STORE_PREFIX.CLOTHING}${pathname === "/" ? "" : pathname}`;
    target.search = search;
    return NextResponse.redirect(target, 308);
  }

  // Admin, sitemap and robots aren't part of either store; they still get
  // the header so anything reading getDepartment() there behaves as before.
  const sharedHeaders = departmentHeaders(request, "SHOES");

  // First line of defense for page navigation only — every admin Server
  // Function must still call requireStaff()/requireAdmin() itself, since a
  // proxy matcher change could silently stop covering a route (see Next.js
  // proxy.js docs: "Always verify authentication ... inside each Server
  // Function rather than relying on Proxy alone").
  //
  // Only checks that the session cookie is present, not that it's actually
  // valid — that would mean a DB round trip on every single admin request.
  // The real (DB-backed) check already happens once more in the protected
  // layout (getCurrentStaff(), which redirects to login itself if the cookie
  // turns out to be missing/expired/tampered), so this only needs to catch
  // the common case — no cookie at all — cheaply. The ADMIN-only gate for
  // /admin/staff lives in that section's own pages now, for the same reason.
  //
  // Admin is Vietnamese-only staff tooling, so it's checked first and never
  // touches next-intl's locale routing below — only customer-facing routes
  // get locale detection/redirects.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname === "/admin/google-callback") {
      return NextResponse.next({ request: { headers: sharedHeaders } });
    }

    if (!request.cookies.has(SESSION_COOKIE_NAME)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next({ request: { headers: sharedHeaders } });
  }

  // Not locale-prefixable routes — Next always serves these at the root
  // regardless of visitor locale, so they must skip the locale-redirect
  // logic below entirely (it would otherwise 404 a crawler by redirecting
  // it to e.g. /en/sitemap.xml, which doesn't exist).
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    return NextResponse.next({ request: { headers: sharedHeaders } });
  }

  if (!request.cookies.has("NEXT_LOCALE")) {
    const country = request.headers.get("x-vercel-ip-country");
    const detected = detectLocaleFromCountry(country);
    if (detected && detected !== routing.defaultLocale) {
      const hasLocalePrefix = routing.locales.some(
        (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
      );
      if (!hasLocalePrefix) {
        const url = new URL(`/${detected}${pathname === "/" ? "" : pathname}`, request.url);
        url.search = request.nextUrl.search;
        const res = NextResponse.redirect(url);
        res.cookies.set("NEXT_LOCALE", detected, { maxAge: 60 * 60 * 24 * 365 });
        captureAttribution(request, res);
        return res;
      }
    }
  }

  const store = routeStore(request);
  if (store instanceof NextResponse) {
    captureAttribution(request, store);
    return store;
  }

  // next-intl only ever sees the store-less path (e.g. "/en/san-pham/x"),
  // so its locale handling works exactly as it did before the stores were
  // merged; its answer is then mapped back onto the real URL:
  // - a redirect: put the store prefix back into the target;
  // - a rewrite: already points at the internal route, keep it;
  // - a pass-through: only valid if the path didn't change, otherwise it
  //   becomes a rewrite to the store-less path, carrying the same locale
  //   header next-intl would have set.
  const headersWithDepartment = departmentHeaders(request, store.department);
  const internalUrl = new URL(store.internal + search, request.url);
  const res = intlMiddleware(new NextRequest(internalUrl, { headers: headersWithDepartment }));

  const location = res.headers.get("location");
  if (location) {
    const target = new URL(location, request.url);
    target.pathname = store.restore(target.pathname);
    res.headers.set("location", target.toString());
  } else if (!res.headers.get("x-middleware-rewrite") && store.internal !== pathname) {
    const locale = localeOf(store.internal).slice(1) || routing.defaultLocale;
    const headers = new Headers(headersWithDepartment);
    headers.set("X-NEXT-INTL-LOCALE", locale);
    const rewritten = NextResponse.rewrite(internalUrl, { request: { headers } });
    for (const cookie of res.cookies.getAll()) rewritten.cookies.set(cookie);
    captureAttribution(request, rewritten);
    return rewritten;
  }

  captureAttribution(request, res);
  return res;
}

export const config = {
  // Runs on every request except static assets/API routes/admin (admin is
  // handled inline above, matched here too since it needs the auth check).
  // The negative lookahead excludes any path with a dot (static files like
  // .js/.css/.png) — sitemap.xml and robots.txt are Next's own generated
  // routes, not static files, but their paths also contain a dot, so they'd
  // silently never get the x-department header without being listed here
  // explicitly (see src/app/sitemap.ts, src/app/robots.ts).
  matcher: ["/((?!api|_next|.*\\..*).*)", "/sitemap.xml", "/robots.txt"],
};
