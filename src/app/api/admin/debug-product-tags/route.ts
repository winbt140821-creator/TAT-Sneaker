import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Temporary staff-only diagnostic to check whether Meta actually accepted
// product_tags on recent Facebook Page photos — the Graph API silently
// drops the field instead of erroring when the Page isn't shopping-enabled,
// so this is the only way to tell without hunting through raw Graph API
// Explorer output. Delete once the Shop/product-tagging question is settled.
export async function GET() {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.socialAccount.findFirst({ where: { platform: "FACEBOOK" } });
  if (!account) return NextResponse.json({ error: "No Facebook account connected" }, { status: 404 });

  const params = new URLSearchParams({
    fields: "id,created_time,link,name,product_tags",
    limit: "15",
    access_token: account.accessToken,
  });
  const res = await fetch(`https://graph.facebook.com/v21.0/${account.pageId}/photos?${params}`);
  const data = await res.json();

  return NextResponse.json(data);
}
