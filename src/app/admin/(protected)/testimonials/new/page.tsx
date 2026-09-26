import { editingStore, getAdminStore } from "@/lib/admin-store";
import { createTestimonialAction } from "../actions";
import { TestimonialForm } from "../TestimonialForm";

export default async function NewTestimonialPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department } = await searchParams;
  const store = editingStore(department, await getAdminStore());
  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm đánh giá</h1>
      <div className="mt-6">
        <TestimonialForm
          action={createTestimonialAction}
          defaultValues={{ department: store }}
          submitLabel="Đăng đánh giá"
        />
      </div>
    </div>
  );
}
