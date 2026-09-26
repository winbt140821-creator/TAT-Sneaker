import { AdminLink as Link } from "@/components/admin/AdminLink";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { editingStore, getAdminStore } from "@/lib/admin-store";
import { DepartmentTabs } from "@/components/admin/DepartmentTabs";
import { deleteTestimonialAction } from "./actions";
import { RowActions } from "@/components/admin/RowActions";

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department: departmentParam } = await searchParams;
  // Each store's homepage shows its own reviews — an explicit tab wins,
  // otherwise follow the admin store switch.
  const department = editingStore(departmentParam, await getAdminStore());
  const testimonials = await prisma.testimonial.findMany({
    where: { department },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Đánh giá khách hàng</h1>
        <Link
          href={`/admin/testimonials/new?department=${department}`}
          className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          + Thêm đánh giá
        </Link>
      </div>

      <DepartmentTabs basePath="/admin/testimonials" department={department} className="mt-4" />

      <div className="mt-6 flex flex-col gap-3">
        {testimonials.length === 0 && (
          <p className="font-mono text-xs text-graphite">Chưa có đánh giá nào.</p>
        )}
        {testimonials.map((t) => (
          <div key={t.id} className="die-cut flex flex-wrap items-center gap-4 bg-paper p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-kraft-dark/30">
              {t.avatarUrl ? (
                <Image src={t.avatarUrl} alt={t.authorName} width={48} height={48} className="h-full w-full object-cover" />
              ) : (
                <span className="font-mono text-[9px] text-graphite">{t.authorName.slice(0, 1)}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-medium text-ink">{t.authorName}</p>
              <p className="truncate font-mono text-xs text-graphite">{t.quote}</p>
            </div>

            <RowActions
              editHref={`/admin/testimonials/${t.id}/edit`}
              deleteAction={deleteTestimonialAction.bind(null, t.id)}
              deleteConfirmMessage={`Xóa đánh giá của "${t.authorName}"?`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
