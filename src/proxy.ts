import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getStaffByToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// First-ever visit only (no saved language preference yet): default the
// locale from the visitor's country — Vercel's edge network sets this
// header automatically in production; it's absent in local dev, which is
// fine, detection then just falls through to next-intl's normal
// Accept-Language/defaultLocale behavior.
const COUNTRY_TO_LOCALE: Partial<Record<string, (typeof routing.locales)[number]>> = {
  CN: "zh",
  TW: "zh",
  HK: "zh",
  MO: "zh",
  SG: "zh",
};

// First line of defense for page navigation only — every admin Server
// Function must still call requireStaff()/requireAdmin() itself, since a
// proxy matcher change could silently stop covering a route (see Next.js
// proxy.js docs: "Always verify authentication ... inside each Server
// Function rather than relying on Proxy alone").
//
// Admin is Vietnamese-only staff tooling, so it's checked first and never
// touches next-intl's locale routing below — only customer-facing routes
// get locale detection/redirects.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname === "/admin/google-callback") {
      return NextResponse.next();
    }

    const staff = await getStaffByToken(
      request.cookies.get(SESSION_COOKIE_NAME)?.value
    );

    if (!staff) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (pathname.startsWith("/admin/staff") && staff.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  if (!request.cookies.has("NEXT_LOCALE")) {
    const country = request.headers.get("x-vercel-ip-country");
    const detected = country ? COUNTRY_TO_LOCALE[country.toUpperCase()] : undefined;
    if (detected && detected !== routing.defaultLocale) {
      const hasLocalePrefix = routing.locales.some(
        (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
      );
      if (!hasLocalePrefix) {
        const url = new URL(`/${detected}${pathname === "/" ? "" : pathname}`, request.url);
        url.search = request.nextUrl.search;
        const res = NextResponse.redirect(url);
        res.cookies.set("NEXT_LOCALE", detected, { maxAge: 60 * 60 * 24 * 365 });
        return res;
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Runs on every request except static assets/API routes/admin (admin is
  // handled inline above, matched here too since it needs the auth check).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
