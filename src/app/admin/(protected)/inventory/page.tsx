import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { adjustSizeQuantityAction } from "./actions";
import { SearchIcon } from "@/components/icons";
import { getCarriedSizes, getTotalQuantity } from "@/lib/inventory";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const products = await prisma.product.findMany({
    where: query ? { OR: [{ name: { contains: query } }, { sku: { contains: query } }] } : {},
    orderBy: { name: "asc" },
  });

  const parsed = products.map((p) => ({
    product: p,
    images: JSON.parse(p.images || "[]") as string[],
    sizeQuantities: JSON.parse(p.sizeQuantities || "{}") as Record<string, number>,
  }));

  const grandTotal = parsed.reduce((sum, p) => sum + getTotalQuantity(p.sizeQuantities), 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Kho hàng</h1>
      <p className="mt-1 font-mono text-xs text-graphite">
        Bấm + / − để điều chỉnh số lượng từng size. Muốn đổi size sản phẩm carry, vào Sửa sản phẩm.
      </p>

      <div className="die-cut mt-4 inline-block bg-forest px-5 py-3">
        <p className="font-display text-2xl text-paper">{grandTotal}</p>
        <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-paper/80">
          Tổng số đôi toàn kho
        </p>
      </div>

      <form role="search" action="/admin/inventory" className="relative mt-4 max-w-sm">
        <label htmlFor="inventory-search" className="sr-only">
          Tìm sản phẩm
        </label>
        <input
          id="inventory-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Tìm theo tên hoặc mã SKU..."
          className="w-full border border-graphite bg-paper px-3 py-2 pr-10 text-sm text-ink focus:border-forest"
        />
        <button
          type="submit"
          aria-label="Tìm kiếm"
          className="absolute right-1 top-1 flex h-[calc(100%-0.5rem)] w-8 cursor-pointer items-center justify-center text-graphite transition-colors hover:text-ink"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </form>

      {query && (
        <p className="mt-2 font-mono text-xs text-graphite">
          {products.length} kết quả cho &quot;{query}&quot;.{" "}
          <Link href="/admin/inventory" className="text-forest hover:underline">
            Xóa tìm kiếm
          </Link>
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {query && products.length === 0 && (
          <p className="font-mono text-xs text-graphite">Không tìm thấy sản phẩm nào.</p>
        )}
        {parsed.map(({ product: p, images, sizeQuantities }) => {
          const productTotal = getTotalQuantity(sizeQuantities);

          return (
            <div key={p.id} className="die-cut flex flex-wrap items-center gap-4 bg-paper p-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-kraft-dark/30">
                {images[0] ? (
                  <Image src={images[0]} alt={p.name} width={56} height={56} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-mono text-[9px] text-graphite">Ảnh</span>
                )}
              </div>

              <div className="w-48 shrink-0">
                <p className="font-mono text-[11px] tracking-widest text-graphite">{p.sku}</p>
                <p className="truncate font-body text-sm font-medium text-ink">{p.name}</p>
              </div>

              <ul
                className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-1.5"
                aria-label={`Tồn kho ${p.name}`}
              >
                {getCarriedSizes(sizeQuantities).map((s) => {
                  const key = String(s);
                  const qty = sizeQuantities[key] ?? 0;

                  return (
                    <li key={s}>
                      <div
                        className={`flex items-center justify-between gap-1 border p-1.5 sm:w-9 sm:flex-col sm:items-center sm:justify-center sm:gap-0.5 sm:p-1 ${
                          qty > 0 ? "border-forest bg-forest/5" : "border-stamp bg-stamp/5"
                        }`}
                      >
                        <span className="font-mono text-xs text-graphite sm:text-[10px]">{s}</span>
                        <div className="flex items-center gap-1 sm:gap-0.5">
                          <form action={adjustSizeQuantityAction.bind(null, p.id, s, -1)}>
                            <button
                              type="submit"
                              disabled={qty <= 0}
                              aria-label={`Giảm số lượng size ${s}`}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded font-mono text-base text-graphite hover:text-stamp active:bg-stamp/10 disabled:cursor-not-allowed disabled:opacity-30 sm:h-5 sm:w-3.5 sm:rounded-none sm:text-[10px] sm:active:bg-transparent"
                            >
                              −
                            </button>
                          </form>
                          <span
                            className={`w-5 text-center font-mono text-sm font-semibold sm:w-4 sm:text-[11px] ${
                              qty > 0 ? "text-forest" : "text-stamp"
                            }`}
                          >
                            {qty}
                          </span>
                          <form action={adjustSizeQuantityAction.bind(null, p.id, s, 1)}>
                            <button
                              type="submit"
                              aria-label={`Tăng số lượng size ${s}`}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded font-mono text-base text-graphite hover:text-forest active:bg-forest/10 sm:h-5 sm:w-3.5 sm:rounded-none sm:text-[10px] sm:active:bg-transparent"
                            >
                              +
                            </button>
                          </form>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="ml-auto shrink-0 font-mono text-sm font-semibold text-ink">
                Tổng: <span className="text-forest">{productTotal}</span> đôi
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
