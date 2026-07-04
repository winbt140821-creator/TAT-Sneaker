import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getStaffByToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

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

  return intlMiddleware(request);
}

export const config = {
  // Runs on every request except static assets/API routes/admin (admin is
  // handled inline above, matched here too since it needs the auth check).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
