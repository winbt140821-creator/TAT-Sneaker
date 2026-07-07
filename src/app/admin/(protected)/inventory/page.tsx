import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { adjustSizeQuantityAction, setSizeQuantityAction } from "./actions";
import { SearchIcon } from "@/components/icons";
import { getCarriedSizes, getRealStockSizes, getRealStockTotal } from "@/lib/inventory";

// Rendering every product's size grid is a lot of DOM (a handful of forms
// per size, times every carried size, times every product) — capping the
// page keeps that bounded instead of growing without limit as the catalog
// does. The grand total below still covers the whole catalog (a single
// cheap query), only the per-product breakdown is paginated.
const PAGE_SIZE = 20;

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim();
  const page = Math.max(1, Number(pageParam) || 1);
  const where = query ? { OR: [{ name: { contains: query } }, { sku: { contains: query } }] } : {};

  const [products, totalCount, allForGrandTotal] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { id: true, sku: true, name: true, images: true, sizeQuantities: true, availability: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({ select: { sizeQuantities: true, availability: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const parsed = products.map((p) => ({
    product: p,
    images: JSON.parse(p.images || "[]") as string[],
    sizeQuantities: JSON.parse(p.sizeQuantities || "{}") as Record<string, number>,
  }));

  const grandTotal = allForGrandTotal.reduce(
    (sum, p) =>
      sum +
      getRealStockTotal(
        JSON.parse(p.sizeQuantities || "{}") as Record<string, number>,
        p.availability === "PREORDER"
      ),
    0
  );

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Kho hàng</h1>
      <p className="mt-1 font-mono text-xs text-graphite">
        Bấm + / − để tăng giảm nhanh, hoặc gõ thẳng số lượng rồi bấm Lưu. Muốn đổi size sản phẩm carry, vào Sửa sản
        phẩm. Chỉ hiển thị size có sẵn hàng thực tế — size chờ đặt trước không tính vào kho.
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
          {totalCount} kết quả cho &quot;{query}&quot;.{" "}
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
          const isPreorder = p.availability === "PREORDER";
          const realStockSizes = getRealStockSizes(sizeQuantities, isPreorder);
          const productTotal = getRealStockTotal(sizeQuantities, isPreorder);
          const hiddenSizes = isPreorder
            ? getCarriedSizes(sizeQuantities).filter((s) => !realStockSizes.includes(s))
            : [];

          return (
            <div key={p.id} className="die-cut flex flex-col gap-3 bg-paper p-3">
              <div className="flex flex-wrap items-center gap-4">
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

                {realStockSizes.length === 0 && (
                  <p className="font-mono text-xs text-graphite">Chưa có hàng thực tế, chỉ nhận đặt trước.</p>
                )}

                <ul className="flex flex-wrap gap-1.5" aria-label={`Tồn kho ${p.name}`}>
                  {realStockSizes.map((s) => {
                    const key = String(s);
                    const qty = sizeQuantities[key] ?? 0;

                    return (
                      <li key={s}>
                        <div
                          className={`flex items-center gap-1 border p-1 ${
                            qty > 0 ? "border-forest bg-forest/5" : "border-stamp bg-stamp/5"
                          }`}
                        >
                          <span className="px-1 font-mono text-[10px] text-graphite">{s}</span>
                          <form action={adjustSizeQuantityAction.bind(null, p.id, s, -1)}>
                            <button
                              type="submit"
                              disabled={qty <= 0}
                              aria-label={`Giảm số lượng size ${s}`}
                              className="flex h-8 w-6 cursor-pointer items-center justify-center font-mono text-sm text-graphite hover:text-stamp disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              −
                            </button>
                          </form>
                          <form
                            action={setSizeQuantityAction.bind(null, p.id)}
                            className="flex items-center gap-1"
                          >
                            <input type="hidden" name="size" value={s} />
                            <input
                              type="number"
                              name="quantity"
                              min={0}
                              defaultValue={qty}
                              aria-label={`Số lượng size ${s}`}
                              className={`w-12 border px-1 py-1 text-center font-mono text-xs focus:border-forest ${
                                qty > 0 ? "border-forest/40 text-forest" : "border-stamp/40 text-stamp"
                              }`}
                            />
                            <button
                              type="submit"
                              className="cursor-pointer bg-ink px-1.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-ink-soft"
                            >
                              Lưu
                            </button>
                          </form>
                          <form action={adjustSizeQuantityAction.bind(null, p.id, s, 1)}>
                            <button
                              type="submit"
                              aria-label={`Tăng số lượng size ${s}`}
                              className="flex h-8 w-6 cursor-pointer items-center justify-center font-mono text-sm text-graphite hover:text-forest"
                            >
                              +
                            </button>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <p className="ml-auto shrink-0 font-mono text-sm font-semibold text-ink">
                  Tổng: <span className="text-forest">{productTotal}</span> đôi
                </p>
              </div>

              {hiddenSizes.length > 0 && (
                <form
                  action={setSizeQuantityAction.bind(null, p.id)}
                  className="flex flex-wrap items-center gap-2 border-t border-kraft-dark pt-3"
                >
                  <label className="font-mono text-[11px] uppercase tracking-wide text-graphite">
                    Vừa có hàng size
                  </label>
                  <select
                    name="size"
                    aria-label="Chọn size vừa có hàng"
                    className="border border-graphite bg-paper px-2 py-1.5 font-mono text-xs text-ink focus:border-forest"
                  >
                    {hiddenSizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="quantity"
                    min={1}
                    defaultValue={1}
                    aria-label="Số lượng"
                    className="w-16 border border-graphite bg-paper px-2 py-1.5 text-center font-mono text-xs text-ink focus:border-forest"
                  />
                  <button
                    type="submit"
                    className="cursor-pointer bg-forest px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-forest-dark"
                  >
                    Thêm vào kho
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/inventory?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`}
              aria-current={p === page ? "page" : undefined}
              className={
                "die-cut-flat flex h-9 w-9 cursor-pointer items-center justify-center font-mono text-sm " +
                (p === page ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-kraft-dark/40")
              }
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
