import { editingStore, getAdminStore } from "@/lib/admin-store";
import { createNewsAction } from "../actions";
import { NewsForm } from "../NewsForm";

export default async function NewNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department } = await searchParams;
  const store = editingStore(department, await getAdminStore());
  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm bài viết</h1>
      <div className="mt-6">
        <NewsForm action={createNewsAction} defaultValues={{ department: store }} submitLabel="Đăng bài" />
      </div>
    </div>
  );
}
