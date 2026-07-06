import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { updateProductAction } from "../../actions";
import { ProductForm } from "../../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, settings] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { categories: true } }),
    prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { sortOrder: "asc" } } },
      orderBy: { label: "asc" },
    }),
    getSiteSettings(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sửa sản phẩm</h1>
      <div className="mt-6">
        <ProductForm
          action={updateProductAction.bind(null, product.id)}
          categories={categories}
          usdExchangeRate={settings?.usdExchangeRate}
          cnyExchangeRate={settings?.cnyExchangeRate}
          defaultValues={{
            name: product.name,
            sku: product.sku,
            price: product.price,
            costPrice: product.costPrice,
            shippingFee: product.shippingFee,
            quality: product.quality,
            sizeQuantities: JSON.parse(product.sizeQuantities || "{}"),
            categoryIds: product.categories.map((c) => c.id),
            images: JSON.parse(product.images || "[]"),
            videoUrl: product.videoUrl,
            availability: product.availability,
            leadTimeMinDays: product.leadTimeMinDays,
            leadTimeMaxDays: product.leadTimeMaxDays,
            depositRequired: product.depositRequired,
            depositAmount: product.depositAmount,
          }}
          submitLabel="Lưu thay đổi"
        />
      </div>
    </div>
  );
}
