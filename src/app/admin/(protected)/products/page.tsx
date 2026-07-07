import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { deleteProductAction } from "./actions";
import { RowActions } from "@/components/admin/RowActions";
import { SearchIcon } from "@/components/icons";

// Only fetch the fields this list actually renders — the full Product row
// also carries images/sizeQuantities/description/costPrice JSON blobs that
// this page never touches, multiplied by every row otherwise.
const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim();
  const page = Math.max(1, Number(pageParam) || 1);
  const where = query ? { OR: [{ name: { contains: query } }, { sku: { contains: query } }] } : {};

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        images: true,
        categories: { select: { id: true, label: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
            <div key={p.id} className="die-cut flex flex-col gap-3 bg-paper p-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 items-center gap-4">
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
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.categories.map((c) => (
                      <span key={c.id} className="bg-kraft-dark/40 px-1.5 py-0.5 font-mono text-[10px] text-graphite">
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-4 sm:ml-auto sm:justify-end">
                <p className="font-mono text-sm font-semibold text-forest">{formatPrice(p.price)}</p>

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
