import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateCategoryAction } from "../../actions";
import { CategoryForm } from "../../CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, parents] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({
      where: { parentId: null, NOT: { id } },
      orderBy: { label: "asc" },
      select: { id: true, label: true },
    }),
  ]);

  if (!category) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sửa danh mục</h1>
      <div className="mt-6">
        <CategoryForm
          action={updateCategoryAction.bind(null, category.id)}
          parents={parents}
          defaultValues={category}
          submitLabel="Lưu thay đổi"
        />
      </div>
    </div>
  );
}
