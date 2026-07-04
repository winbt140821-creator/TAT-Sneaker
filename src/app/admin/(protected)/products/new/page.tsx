import { prisma } from "@/lib/db";
import { createProductAction } from "../actions";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { sortOrder: "asc" } } },
    orderBy: { label: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm sản phẩm</h1>
      <div className="mt-6">
        <ProductForm action={createProductAction} categories={categories} submitLabel="Tạo sản phẩm" />
      </div>
    </div>
  );
}
