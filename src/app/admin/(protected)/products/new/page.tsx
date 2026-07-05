import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { createProductAction } from "../actions";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { sortOrder: "asc" } } },
      orderBy: { label: "asc" },
    }),
    getSiteSettings(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm sản phẩm</h1>
      <div className="mt-6">
        <ProductForm
          action={createProductAction}
          categories={categories}
          submitLabel="Tạo sản phẩm"
          usdExchangeRate={settings?.usdExchangeRate}
          cnyExchangeRate={settings?.cnyExchangeRate}
        />
      </div>
    </div>
  );
}
