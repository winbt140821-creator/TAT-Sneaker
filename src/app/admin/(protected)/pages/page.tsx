import { AdminLink as Link } from "@/components/admin/AdminLink";
import { prisma } from "@/lib/db";
import { editingStore, getAdminStore, STORE_LABEL } from "@/lib/admin-store";
import { FOOTER_PAGES } from "@/lib/footer-pages";
import { RowActions } from "@/components/admin/RowActions";
import { DepartmentTabs } from "@/components/admin/DepartmentTabs";

export default async function AdminStaticPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department: departmentParam } = await searchParams;
  // An explicit tab (?department=) wins; otherwise follow the admin store switch.
  const department = editingStore(departmentParam, await getAdminStore());

  const [pages, shoePages] = await Promise.all([
    prisma.staticPage.findMany({ where: { department }, orderBy: { title: "asc" } }),
    department === "CLOTHING"
      ? prisma.staticPage.findMany({ where: { department: "SHOES" }, orderBy: { title: "asc" } })
      : Promise.resolve([]),
  ]);

  // The clothing store shows the shoe store's copy of any page it hasn't
  // written for itself — listed separately so staff can see what the
  // clothing footer currently opens, and write their own version.
  const own = new Set(pages.map((p) => p.slug));
  const borrowed = shoePages.filter((p) => !own.has(p.slug));
  const missing = FOOTER_PAGES.filter((p) => !own.has(p.slug) && !borrowed.some((b) => b.slug === p.slug));

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Trang nội dung</h1>
        <Link
          href={`/admin/pages/new?department=${department}`}
          className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          + Thêm trang
        </Link>
      </div>
      <p className="mt-1 font-mono text-xs text-graphite">
        Nội dung các liên kết chính sách / hỗ trợ / giới thiệu hiển thị ở chân trang của cửa hàng{" "}
        {STORE_LABEL[department].toLowerCase()}.
      </p>

      <DepartmentTabs basePath="/admin/pages" department={department} className="mt-4" />

      <div className="mt-6 flex flex-col gap-3">
        {pages.length === 0 && borrowed.length === 0 && (
          <p className="font-mono text-xs text-graphite">Chưa có trang nào.</p>
        )}
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

      {borrowed.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg text-ink">Đang dùng nội dung của web giày</h2>
          <p className="mt-1 font-mono text-xs text-graphite">
            Web quần áo chưa có bản riêng của các trang này nên đang hiện bản của web giày. Bấm &ldquo;Viết
            bản riêng&rdquo; để sửa lại cho quần áo — bản của web giày giữ nguyên.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {borrowed.map((p) => (
              <div key={p.id} className="die-cut-flat flex flex-wrap items-center gap-4 bg-kraft p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-ink">{p.title}</p>
                  <p className="truncate font-mono text-xs text-graphite">/trang/{p.slug}</p>
                </div>
                <Link
                  href={`/admin/pages/new?department=CLOTHING&copy=${p.id}`}
                  className="font-mono text-xs uppercase tracking-wide text-ink underline-offset-4 hover:underline"
                >
                  Viết bản riêng
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg text-ink">Chân trang có link nhưng chưa có trang</h2>
          <div className="mt-3 flex flex-col gap-3">
            {missing.map((p) => (
              <div key={p.slug} className="die-cut-flat flex flex-wrap items-center gap-4 bg-stamp/10 p-3">
                <p className="min-w-0 flex-1 font-body text-sm text-ink">{p.title}</p>
                <Link
                  href={`/admin/pages/new?department=${department}&slug=${p.slug}&title=${encodeURIComponent(p.title)}`}
                  className="font-mono text-xs uppercase tracking-wide text-ink underline-offset-4 hover:underline"
                >
                  Tạo trang
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
