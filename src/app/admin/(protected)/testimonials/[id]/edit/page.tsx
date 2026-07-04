import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateTestimonialAction } from "../../actions";
import { TestimonialForm } from "../../TestimonialForm";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sửa đánh giá</h1>
      <div className="mt-6">
        <TestimonialForm
          action={updateTestimonialAction.bind(null, testimonial.id)}
          defaultValues={testimonial}
          submitLabel="Lưu thay đổi"
        />
      </div>
    </div>
  );
}
