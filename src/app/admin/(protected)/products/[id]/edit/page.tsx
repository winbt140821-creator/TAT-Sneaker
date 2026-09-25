import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLiveExchangeRates } from "@/lib/fx";
import { updateProductAction } from "../../actions";
import { ProductForm } from "../../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, rates] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { categories: true } }),
    prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { sortOrder: "asc" } } },
      orderBy: { label: "asc" },
    }),
    getLiveExchangeRates(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sửa sản phẩm</h1>
      {product.sourceUrl && (
        // Where it was imported from — also where to reorder it from the
        // supplier (the album shows their product code).
        <div className="mt-3 max-w-2xl border border-kraft-dark bg-paper p-3 font-body text-sm text-ink">
          {product.hidden && product.price <= 0 && (
            <p className="mb-1 font-medium">
              Sản phẩm mới nhập: kiểm tra tên, mô tả, ảnh và size, điền giá bán, tick “Hiện sản phẩm trên web” rồi lưu.
            </p>
          )}
          <a
            href={product.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-graphite hover:text-ink hover:underline"
          >
            Nhập từ album Yupoo ↗
          </a>
        </div>
      )}
      <div className="mt-6">
        <ProductForm
          action={updateProductAction.bind(null, product.id)}
          categories={categories}
          usdExchangeRate={rates.usdExchangeRate}
          cnyExchangeRate={rates.cnyExchangeRate}
          defaultValues={{
            name: product.name,
            sku: product.sku,
            // An imported product has no price yet — an empty box, not "0".
            price: product.price > 0 ? product.price : undefined,
            costPrice: product.costPrice,
            shippingFee: product.shippingFee,
            quality: product.quality,
            department: product.department,
            sizeQuantities: JSON.parse(product.sizeQuantities || "{}"),
            categoryIds: product.categories.map((c) => c.id),
            images: JSON.parse(product.images || "[]"),
            videoUrl: product.videoUrl,
            description: product.description,
            availability: product.availability,
            leadTimeMinDays: product.leadTimeMinDays,
            leadTimeMaxDays: product.leadTimeMaxDays,
            depositRequired: product.depositRequired,
            depositAmount: product.depositAmount,
            hidden: product.hidden,
          }}
          submitLabel="Lưu thay đổi"
        />
      </div>
    </div>
  );
}
