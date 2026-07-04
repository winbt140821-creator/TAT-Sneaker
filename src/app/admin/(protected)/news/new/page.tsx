import { createNewsAction } from "../actions";
import { NewsForm } from "../NewsForm";

export default function NewNewsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm bài viết</h1>
      <div className="mt-6">
        <NewsForm action={createNewsAction} submitLabel="Đăng bài" />
      </div>
    </div>
  );
}
