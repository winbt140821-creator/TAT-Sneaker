import { prisma } from "@/lib/db";
import { createCategoryAction } from "../actions";
import { CategoryForm } from "../CategoryForm";
import type { Department } from "@/lib/inventory";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ parentId?: string; department?: string }>;
}) {
  const { parentId, department: departmentParam } = await searchParams;
  const department: Department = departmentParam === "CLOTHING" ? "CLOTHING" : "SHOES";
  const parents = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { label: "asc" },
    select: { id: true, label: true, department: true },
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
          defaultValues={{ parentId, department }}
          submitLabel="Tạo danh mục"
        />
      </div>
    </div>
  );
}
