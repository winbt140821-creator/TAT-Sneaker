import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Temporary staff-only diagnostic to check whether Meta actually accepted
// product_tags on a given Facebook post's photos — the Graph API silently
// drops the field instead of erroring when the Page isn't shopping-enabled,
// so this is the only way to tell without hunting through raw Graph API
// Explorer output. Delete once the Shop/product-tagging question is settled.
export async function GET(request: NextRequest) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permalink = request.nextUrl.searchParams.get("permalink");
  if (!permalink) return NextResponse.json({ error: "Missing ?permalink=" }, { status: 400 });

  const account = await prisma.socialAccount.findFirst({ where: { platform: "FACEBOOK" } });
  if (!account) return NextResponse.json({ error: "No Facebook account connected" }, { status: 404 });

  const token = account.accessToken;
  const resolveRes = await fetch(
    `https://graph.facebook.com/v21.0/?id=${encodeURIComponent(permalink)}&access_token=${token}`
  );
  const resolved = await resolveRes.json();
  if (!resolved.id) return NextResponse.json({ error: "Could not resolve post", resolved }, { status: 400 });

  const postRes = await fetch(
    `https://graph.facebook.com/v21.0/${resolved.id}?fields=attachments{media,target,type}&access_token=${token}`
  );
  const post = await postRes.json();

  const photoIds: string[] = [];
  for (const a of post.attachments?.data ?? []) {
    if (a.target?.id) photoIds.push(a.target.id);
    for (const sub of a.subattachments?.data ?? []) {
      if (sub.target?.id) photoIds.push(sub.target.id);
    }
  }

  const tags = await Promise.all(
    photoIds.map(async (id) => {
      const r = await fetch(
        `https://graph.facebook.com/v21.0/${id}?fields=product_tags&access_token=${token}`
      );
      const data = await r.json();
      return { photoId: id, product_tags: data.product_tags ?? null, error: data.error?.message };
    })
  );

  return NextResponse.json({ postId: resolved.id, photoCount: photoIds.length, tags });
}
