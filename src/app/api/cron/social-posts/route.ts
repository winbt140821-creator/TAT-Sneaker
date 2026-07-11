import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { publishToTarget, type PublishTarget } from "@/lib/meta";

// Called every minute by an external cron pinger (cron-job.org or similar) —
// Vercel serverless has no long-running process to run our own setInterval
// scheduler in, and Vercel Cron's own minimum interval isn't fine-grained
// enough on every plan tier. Protected by a shared-secret query param since
// this has to be reachable with no admin session (the caller is an external
// service, not a logged-in browser).
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.socialPost.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
  });

  let processed = 0;
  for (const post of due) {
    const targetIds: string[] = JSON.parse(post.targetIds || "[]");
    const images: string[] = JSON.parse(post.images || "[]");
    const accounts = await prisma.socialAccount.findMany({ where: { id: { in: targetIds } } });

    const results = await Promise.all(
      accounts.map(async (a) => {
        const target: PublishTarget = {
          platform: a.platform,
          pageId: a.pageId,
          igUserId: a.igUserId,
          accessToken: a.accessToken,
          name: a.name,
        };
        try {
          const r = await publishToTarget(target, {
            message: post.message ?? "",
            images,
            productId: post.productId,
          });
          return { targetId: a.id, name: a.name, ok: true, link: r.url };
        } catch (err) {
          return {
            targetId: a.id,
            name: a.name,
            ok: false,
            error: err instanceof Error ? err.message : "Lỗi không xác định",
          };
        }
      })
    );

    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: results.every((r) => r.ok) ? "PUBLISHED" : results.some((r) => r.ok) ? "PARTIAL" : "FAILED",
        results: JSON.stringify(results),
        publishedAt: new Date(),
      },
    });
    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
