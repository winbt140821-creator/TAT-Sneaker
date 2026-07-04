import { prisma } from "@/lib/db";
import { createCategoryAction } from "../actions";
import { CategoryForm } from "../CategoryForm";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ parentId?: string }>;
}) {
  const { parentId } = await searchParams;
  const parents = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { label: "asc" },
    select: { id: true, label: true },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm danh mục</h1>
      <p className="mt-1 font-mono text-xs text-graphite">
        Danh mục gốc hiện trên thanh menu chính. Danh mục con hiện trong dropdown.
      </p>
      <div className="mt-6">
        <CategoryForm
          action={createCategoryAction}
          parents={parents}
          defaultValues={{ parentId }}
          submitLabel="Tạo danh mục"
        />
      </div>
    </div>
  );
}
