import { AdminLink as Link } from "@/components/admin/AdminLink";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { deleteProductAction, moveProductAction, toggleProductHiddenAction } from "./actions";
import { RowActions } from "@/components/admin/RowActions";
import { SearchIcon, ChevronDownIcon } from "@/components/icons";

// Only fetch the fields this list actually renders — the full Product row
// also carries images/sizeQuantities/description/costPrice JSON blobs that
// this page never touches, multiplied by every row otherwise.
const PAGE_SIZE = 20;

function MoveButtons({ id, disableUp, disableDown }: { id: string; disableUp: boolean; disableDown: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <form action={moveProductAction.bind(null, id, "up")}>
        <button
          type="submit"
          disabled={disableUp}
          aria-label="Đưa lên trước"
          className="flex h-11 w-11 cursor-pointer items-center justify-center text-graphite hover:text-ink disabled:cursor-not-allowed disabled:opacity-20"
        >
          <ChevronDownIcon className="h-4 w-4 rotate-180" />
        </button>
      </form>
      <form action={moveProductAction.bind(null, id, "down")}>
        <button
          type="submit"
          disabled={disableDown}
          aria-label="Đưa xuống sau"
          className="flex h-11 w-11 cursor-pointer items-center justify-center text-graphite hover:text-ink disabled:cursor-not-allowed disabled:opacity-20"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim();
  const page = Math.max(1, Number(pageParam) || 1);
  const where = query ? { OR: [{ name: { contains: query } }, { sku: { contains: query } }] } : {};

  const [products, totalCount, sortOrderBounds] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        images: true,
        hidden: true,
        sortOrder: true,
        categories: { select: { id: true, label: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    // Display order is global, not scoped to this page's search/filter, so
    // "first"/"last" (for disabling the move buttons) has to be checked
    // against the whole table's sortOrder range, not just this page.
    prisma.product.aggregate({ _min: { sortOrder: true }, _max: { sortOrder: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const minSortOrder = sortOrderBounds._min.sortOrder ?? 0;
  const maxSortOrder = sortOrderBounds._max.sortOrder ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Sản phẩm</h1>
        <Link
          href="/admin/products/new"
          className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          + Thêm sản phẩm
        </Link>
      </div>

      <form role="search" action="/admin/products" className="relative mt-4 max-w-sm">
        <label htmlFor="products-search" className="sr-only">
          Tìm sản phẩm
        </label>
        <input
          id="products-search"
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
          <Link href="/admin/products" className="text-forest hover:underline">
            Xóa tìm kiếm
          </Link>
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {query && products.length === 0 && (
          <p className="font-mono text-xs text-graphite">Không tìm thấy sản phẩm nào.</p>
        )}
        {products.map((p) => {
          const images: string[] = JSON.parse(p.images || "[]");
          return (
            <div
              key={p.id}
              className={`die-cut flex flex-col gap-3 bg-paper p-3 sm:flex-row sm:items-center sm:gap-4 ${p.hidden ? "opacity-60" : ""}`}
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <MoveButtons id={p.id} disableUp={p.sortOrder <= minSortOrder} disableDown={p.sortOrder >= maxSortOrder} />

                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-kraft-dark/30">
                  {images[0] ? (
                    <Image src={images[0]} alt={p.name} width={64} height={64} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-mono text-[10px] text-graphite">Chưa có ảnh</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] tracking-widest text-graphite">{p.sku}</p>
                  <p className="truncate font-body text-sm font-medium text-ink">{p.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {p.hidden && (
                      <span className="bg-stamp/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-stamp">
                        Đã ẩn
                      </span>
                    )}
                    {p.categories.map((c) => (
                      <span key={c.id} className="bg-kraft-dark/40 px-1.5 py-0.5 font-mono text-[10px] text-graphite">
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 sm:ml-auto sm:justify-end sm:gap-4">
                <p className="font-mono text-sm font-semibold text-forest">{formatPrice(p.price)}</p>

                <form action={toggleProductHiddenAction.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="flex min-h-11 cursor-pointer items-center px-2 font-mono text-xs uppercase tracking-wide text-graphite hover:text-ink hover:underline"
                  >
                    {p.hidden ? "Hiện lại" : "Ẩn"}
                  </button>
                </form>

                <RowActions
                  editHref={`/admin/products/${p.id}/edit`}
                  deleteAction={deleteProductAction.bind(null, p.id)}
                  deleteConfirmMessage={`Xóa sản phẩm "${p.name}"?`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`}
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
