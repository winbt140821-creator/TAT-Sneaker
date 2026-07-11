import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exchangeCodeForToken, getLongLivedToken, getPagesAndInstagram } from "@/lib/meta";

// Landing spot after "Kết nối Facebook" on /admin/social. Requires an
// existing staff session (same browser, cookie carries through the Meta
// redirect) — this is a raw OAuth flow, not next-auth, since it needs
// Page/Instagram permissions next-auth's own Facebook provider (customer
// login only) doesn't request.
export async function GET(request: NextRequest) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error_description");
  if (error) {
    return NextResponse.redirect(new URL(`/admin/social?error=${encodeURIComponent(error)}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/admin/social?error=missing_code", request.url));
  }

  try {
    const shortToken = await exchangeCodeForToken(code);
    const longToken = await getLongLivedToken(shortToken);
    const found = await getPagesAndInstagram(longToken);

    for (const acc of found) {
      await prisma.socialAccount.upsert({
        where: { platform_pageId: { platform: acc.platform, pageId: acc.pageId } },
        update: {
          igUserId: acc.igUserId,
          name: acc.name,
          accessToken: acc.accessToken,
          avatarUrl: acc.avatarUrl,
        },
        create: {
          platform: acc.platform,
          pageId: acc.pageId,
          igUserId: acc.igUserId,
          name: acc.name,
          accessToken: acc.accessToken,
          avatarUrl: acc.avatarUrl,
        },
      });
    }

    return NextResponse.redirect(new URL("/admin/social", request.url));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kết nối thất bại";
    return NextResponse.redirect(new URL(`/admin/social?error=${encodeURIComponent(msg)}`, request.url));
  }
}
