import { createTestimonialAction } from "../actions";
import { TestimonialForm } from "../TestimonialForm";

export default function NewTestimonialPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm đánh giá</h1>
      <div className="mt-6">
        <TestimonialForm action={createTestimonialAction} submitLabel="Đăng đánh giá" />
      </div>
    </div>
  );
}
