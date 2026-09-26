import { prisma } from "@/lib/db";
import { editingStore, getAdminStore } from "@/lib/admin-store";
import { createStaticPageAction } from "../actions";
import { PageForm } from "../PageForm";

// ?slug=&title= prefill the form — the dashboard's "Cần làm" list links here
// for each footer page that doesn't exist yet (see FOOTER_PAGES).
// ?copy=<id> starts from another page's content — used to write the
// clothing store's own version of a page it currently borrows from shoes.
export default async function NewStaticPagePage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; title?: string; department?: string; copy?: string }>;
}) {
  const { slug, title, department: departmentParam, copy } = await searchParams;
  const department = editingStore(departmentParam, await getAdminStore());
  const source = copy ? await prisma.staticPage.findUnique({ where: { id: copy } }) : null;

  const prefillSlug = source?.slug ?? slug;
  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm trang nội dung</h1>
      <p className="mt-1 font-mono text-xs text-graphite">
        Dùng cho các trang chính sách / hỗ trợ / giới thiệu hiển thị ở chân trang.
      </p>
      <div className="mt-6">
        <PageForm
          action={createStaticPageAction}
          defaultValues={{
            title: source?.title ?? title?.slice(0, 200) ?? "",
            slug: prefillSlug && /^[a-z0-9-]+$/.test(prefillSlug) ? prefillSlug : "",
            content: source?.content ?? "",
            department,
          }}
          slugEditable
          submitLabel="Tạo trang"
        />
      </div>
    </div>
  );
}
