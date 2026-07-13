import { createStaticPageAction } from "../actions";
import { PageForm } from "../PageForm";

export default function NewStaticPagePage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm trang nội dung</h1>
      <p className="mt-1 font-mono text-xs text-graphite">
        Dùng cho các trang chính sách / hỗ trợ / giới thiệu hiển thị ở chân trang.
      </p>
      <div className="mt-6">
        <PageForm
          action={createStaticPageAction}
          defaultValues={{ title: "", slug: "", content: "" }}
          slugEditable
          submitLabel="Tạo trang"
        />
      </div>
    </div>
  );
}
