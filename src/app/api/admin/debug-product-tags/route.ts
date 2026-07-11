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

  // pfbid permalinks don't reliably resolve via the classic ?id= lookup
  // trick anymore, so instead list the Page's own recent posts (always
  // returns numeric ids the API accepts everywhere) and match by substring.
  const permalinkFragment = request.nextUrl.searchParams.get("permalink");
  if (!permalinkFragment) return NextResponse.json({ error: "Missing ?permalink=" }, { status: 400 });

  const account = await prisma.socialAccount.findFirst({ where: { platform: "FACEBOOK" } });
  if (!account) return NextResponse.json({ error: "No Facebook account connected" }, { status: 404 });

  const token = account.accessToken;
  const listRes = await fetch(
    `https://graph.facebook.com/v21.0/${account.pageId}/posts?fields=id,permalink_url,attachments{media,target,type}&limit=10&access_token=${token}`
  );
  const list = await listRes.json();
  if (!list.data) return NextResponse.json({ error: "Could not list posts", list }, { status: 400 });

  const post = list.data.find((p: { permalink_url?: string }) =>
    p.permalink_url?.includes(permalinkFragment)
  );
  if (!post) {
    return NextResponse.json({
      error: "Post not found in the 10 most recent",
      recent: list.data.map((p: { id: string; permalink_url?: string }) => ({ id: p.id, permalink_url: p.permalink_url })),
    });
  }

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

  return NextResponse.json({ postId: post.id, permalink_url: post.permalink_url, photoCount: photoIds.length, tags });
}
