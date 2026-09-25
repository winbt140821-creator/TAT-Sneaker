import { AdminLink as Link } from "@/components/admin/AdminLink";
import { prisma } from "@/lib/db";
import { getLiveExchangeRates } from "@/lib/fx";
import { createProductAction } from "../actions";
import { ProductForm } from "../ProductForm";

// Opened from the products list with ?department= when the admin store
// switch is on one store, so the form starts on that store and its sizes.
export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department } = await searchParams;
  const [categories, rates] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { sortOrder: "asc" } } },
      orderBy: { label: "asc" },
    }),
    getLiveExchangeRates(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm sản phẩm</h1>
      <p className="mt-2 font-body text-sm text-graphite">
        Có link sản phẩm (Yupoo, web bán hàng khác)?{" "}
        <Link href="/admin/products/import" className="text-ink underline hover:text-forest">
          Dán link để tự lấy ảnh, tên và size
        </Link>
      </p>
      <div className="mt-6">
        <ProductForm
          action={createProductAction}
          categories={categories}
          submitLabel="Tạo sản phẩm"
          defaultValues={department === "CLOTHING" || department === "SHOES" ? { department } : undefined}
          usdExchangeRate={rates.usdExchangeRate}
          cnyExchangeRate={rates.cnyExchangeRate}
        />
      </div>
    </div>
  );
}
