import { AdminLink as Link } from "@/components/admin/AdminLink";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { deleteNewsAction } from "./actions";
import { RowActions } from "@/components/admin/RowActions";

export default async function AdminNewsPage() {
  const articles = await prisma.newsArticle.findMany({
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Tin tức</h1>
        <Link
          href="/admin/news/new"
          className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          + Thêm bài viết
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {articles.length === 0 && (
          <p className="font-mono text-xs text-graphite">Chưa có bài viết nào.</p>
        )}
        {articles.map((a) => (
          <div key={a.id} className="die-cut flex flex-wrap items-center gap-4 bg-paper p-3">
            <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden bg-kraft-dark/30">
              {a.imageUrl ? (
                <Image src={a.imageUrl} alt={a.title} width={80} height={56} className="h-full w-full object-cover" />
              ) : (
                <span className="font-mono text-[9px] text-graphite">Ảnh</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-sm font-medium text-ink">{a.title}</p>
              <p className="font-mono text-xs text-graphite">
                {a.publishedAt.toLocaleDateString("vi-VN")}
              </p>
            </div>

            <RowActions
              editHref={`/admin/news/${a.id}/edit`}
              deleteAction={deleteNewsAction.bind(null, a.id)}
              deleteConfirmMessage={`Xóa bài viết "${a.title}"?`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
