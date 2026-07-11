import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Temporary staff-only diagnostic to check whether Meta actually accepted
// product_tags on a given Facebook post's photo(s) — the Graph API silently
// drops the field instead of erroring when the Page isn't shopping-enabled,
// so this is the only way to tell without hunting through raw Graph API
// Explorer output. Delete once the Shop/product-tagging question is settled.
//
// A post's own attachments.target.id is NOT the underlying Photo object id
// (querying it as a photo fails with "singular statuses API is deprecated") —
// the correct lookup is the post's own `object_id` field, and for a multi-
// photo album post, `attachments.data[].target.id` per sub-attachment.
export async function GET(request: NextRequest) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permalinkFragment = request.nextUrl.searchParams.get("permalink");

  const account = await prisma.socialAccount.findFirst({ where: { platform: "FACEBOOK" } });
  if (!account) return NextResponse.json({ error: "No Facebook account connected" }, { status: 404 });

  const token = account.accessToken;
  const listParams = new URLSearchParams({
    fields: "id,created_time,permalink_url,object_id,attachments{subattachments{target}}",
    limit: "10",
    access_token: token,
  });
  const listRes = await fetch(`https://graph.facebook.com/v21.0/${account.pageId}/posts?${listParams}`);
  const list = await listRes.json();
  if (!list.data) return NextResponse.json({ error: "Could not list posts", list }, { status: 400 });

  const post = permalinkFragment
    ? list.data.find((p: { permalink_url?: string }) => p.permalink_url?.includes(permalinkFragment))
    : list.data[0];
  if (!post) {
    return NextResponse.json({
      error: "Post not found in the 10 most recent",
      recent: list.data.map((p: { id: string; permalink_url?: string }) => ({ id: p.id, permalink_url: p.permalink_url })),
    });
  }

  const photoIds: string[] = [];
  const subs = post.attachments?.data?.[0]?.subattachments?.data ?? [];
  for (const sub of subs) {
    if (sub.target?.id) photoIds.push(sub.target.id);
  }
  if (photoIds.length === 0 && post.object_id) photoIds.push(post.object_id);

  const tags = await Promise.all(
    photoIds.map(async (id) => {
      const r = await fetch(
        `https://graph.facebook.com/v21.0/${id}?fields=product_tags&access_token=${token}`
      );
      const data = await r.json();
      return { photoId: id, product_tags: data.product_tags ?? null, error: data.error?.message };
    })
  );

  return NextResponse.json({
    postId: post.id,
    permalink_url: post.permalink_url,
    photoCount: photoIds.length,
    tags,
  });
}
