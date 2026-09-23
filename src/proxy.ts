import { NextResponse, NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { routing } from "@/i18n/routing";

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
// quanao.tatsneaker.vn is the clothing storefront; every other hostname
// (including tatsneaker.vn and local dev) is the original shoe storefront.
// Set unconditionally, even on the admin branch below — admin stays a single
// shared panel regardless of department, but attaching the header there too
// avoids a special case, and costs nothing.
//
// Reads the `Host` request header rather than request.nextUrl.hostname —
// verified locally that nextUrl.hostname resolves to the server's own bind
// address ("localhost") regardless of what Host the client actually sent,
// while the raw header reflects the real requested hostname.
function departmentFromHost(request: NextRequest): "SHOES" | "CLOTHING" {
  const host = request.headers.get("host") ?? "";
  return host.startsWith("quanao.") ? "CLOTHING" : "SHOES";
}

// Copies the incoming request's headers plus x-department — passed to
// NextResponse.next()/rewrite()'s `request` option so Server Components can
// read it via next/headers, and (separately, see proxy() below) rebuilt into
// a NextRequest to feed next-intl's own middleware, which forwards whatever
// headers the request it receives already carries into its own response.
function departmentHeaders(request: NextRequest, department: string): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-department", department);
  return requestHeaders;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const department = departmentFromHost(request);
  const headersWithDepartment = departmentHeaders(request, department);

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname === "/admin/google-callback") {
      return NextResponse.next({ request: { headers: headersWithDepartment } });
    }

    if (!request.cookies.has(SESSION_COOKIE_NAME)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next({ request: { headers: headersWithDepartment } });
  }

  // Not locale-prefixable routes — Next always serves these at the root
  // regardless of visitor locale, so they must skip the locale-redirect
  // logic below entirely (it would otherwise 404 a crawler by redirecting
  // it to e.g. /en/sitemap.xml, which doesn't exist).
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    return NextResponse.next({ request: { headers: headersWithDepartment } });
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

  // next-intl's own middleware copies `request.headers` verbatim before
  // adding its own locale header (see node_modules/next-intl/dist/esm/
  // development/middleware/middleware.js), so x-department survives by
  // feeding it a request that already carries it.
  const requestWithDepartment = new NextRequest(request.nextUrl, { headers: headersWithDepartment });
  const res = intlMiddleware(requestWithDepartment);
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
