import { createStaticPageAction } from "../actions";
import { PageForm } from "../PageForm";

// ?slug=&title= prefill the form — the dashboard's "Cần làm" list links here
// for each footer page that doesn't exist yet (see FOOTER_PAGES).
export default async function NewStaticPagePage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; title?: string }>;
}) {
  const { slug, title } = await searchParams;
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
            title: title?.slice(0, 200) ?? "",
            slug: slug && /^[a-z0-9-]+$/.test(slug) ? slug : "",
            content: "",
          }}
          slugEditable
          submitLabel="Tạo trang"
        />
      </div>
    </div>
  );
}
