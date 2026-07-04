import { prisma } from "@/lib/db";
import { RowActions } from "@/components/admin/RowActions";

export default async function AdminStaticPagesPage() {
  const pages = await prisma.staticPage.findMany({ orderBy: { title: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Trang nội dung</h1>
      <p className="mt-1 font-mono text-xs text-graphite">
        Nội dung các liên kết chính sách / hỗ trợ / giới thiệu hiển thị ở chân trang.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {pages.map((p) => (
          <div key={p.id} className="die-cut flex flex-wrap items-center gap-4 bg-paper p-3">
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-medium text-ink">{p.title}</p>
              <p className="truncate font-mono text-xs text-graphite">/trang/{p.slug}</p>
            </div>

            <RowActions editHref={`/admin/pages/${p.id}/edit`} />
          </div>
        ))}
      </div>
    </div>
  );
}
