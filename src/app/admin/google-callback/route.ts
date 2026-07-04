import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

// Landing spot after "Đăng nhập bằng Google" on /admin/login. Auth.js has
// already verified the Google identity by the time we get here (see
// src/auth.ts) — this route's only job is deciding whether that verified
// email is also allowed into the admin CMS, by checking it against Staff.
// Must be a Route Handler (not a page component) — cookies() is only
// writable inside a Server Action or Route Handler, and createSession()
// below needs to set the cop_session cookie.
export async function GET(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.redirect(new URL("/admin/login?error=google", request.url));
  }

  const staff = await prisma.staff.findUnique({ where: { email } });

  if (!staff) {
    // Not on the staff list — they may still have a regular customer
    // session from the same Google login, which is harmless and left as-is.
    return NextResponse.redirect(new URL("/admin/login?error=not_staff", request.url));
  }

  await createSession(staff.id);
  return NextResponse.redirect(new URL("/admin", request.url));
}
