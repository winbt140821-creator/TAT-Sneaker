import { AdminLink as Link } from "@/components/admin/AdminLink";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { deleteProductAction, moveProductAction, toggleProductHiddenAction } from "./actions";
import { RowActions } from "@/components/admin/RowActions";
import { SearchIcon, ChevronDownIcon } from "@/components/icons";
import { StoreBadge } from "@/components/admin/StoreBadge";
import { getAdminStore, storeWhere, type AdminStore } from "@/lib/admin-store";
import type { Department } from "@/lib/inventory";
import { getSocialLinkedProducts } from "@/lib/social-links";
import { productListWhere } from "@/lib/admin-product-filter";
import { BulkBar } from "./BulkBar";

// Only fetch the fields this list actually renders — the full Product row
// also carries images/sizeQuantities/description/costPrice JSON blobs that
// this page never touches, multiplied by every row otherwise.
const PAGE_SIZE = 20;

type ProductListItem = {
  id: string;
  sku: string;
  name: string;
  price: number;
  images: string;
  hidden: boolean;
  sortOrder: number;
  department: Department;
  categories: { id: string; label: string }[];
};

function MoveButtons({
  id,
  categoryId,
  disableUp,
  disableDown,
}: {
  id: string;
  categoryId?: string;
  disableUp: boolean;
  disableDown: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <form action={moveProductAction.bind(null, id, "up", categoryId)}>
        <button
          type="submit"
          disabled={disableUp}
          aria-label="Đưa lên trước"
          className="flex h-11 w-11 cursor-pointer items-center justify-center text-graphite hover:text-ink disabled:cursor-not-allowed disabled:opacity-20"
        >
          <ChevronDownIcon className="h-4 w-4 rotate-180" />
        </button>
      </form>
      <form action={moveProductAction.bind(null, id, "down", categoryId)}>
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

function ProductRow({
  p,
  categoryId,
  minSortOrder,
  maxSortOrder,
  linkedPosts,
}: {
  p: ProductListItem;
  categoryId?: string;
  minSortOrder: number;
  maxSortOrder: number;
  // Social posts linking to this product — it can be hidden but not deleted.
  linkedPosts: number;
}) {
  const images: string[] = JSON.parse(p.images || "[]");
  return (
    <div
      className={`die-cut flex flex-col gap-3 bg-paper p-3 sm:flex-row sm:items-center sm:gap-4 ${p.hidden ? "opacity-60" : ""}`}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <input
          type="checkbox"
          name="ids"
          value={p.id}
          form="bulk-products"
          aria-label={`Chọn ${p.name}`}
          className="h-5 w-5 shrink-0 cursor-pointer accent-ink"
        />
        <MoveButtons
          id={p.id}
          categoryId={categoryId}
          disableUp={p.sortOrder <= minSortOrder}
          disableDown={p.sortOrder >= maxSortOrder}
        />

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
            <StoreBadge department={p.department} />
            {p.hidden && (
              <span className="bg-stamp/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-stamp">
                Đã ẩn
              </span>
            )}
            {linkedPosts > 0 && (
              <span
                title="Link sản phẩm này có trong bài đăng. Chỉ ẩn được, không xoá được — link vẫn mở và báo ngừng bán."
                className="bg-ink/10 px-1.5 py-0.5 font-mono text-[10px] text-ink"
              >
                Có trong {linkedPosts} bài đăng
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
        {p.price > 0 ? (
          <p className="font-mono text-sm font-semibold text-forest">{formatPrice(p.price)}</p>
        ) : (
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-stamp">Chưa có giá</p>
        )}

        {p.hidden && p.price <= 0 ? (
          // Showing a product with no price would let shoppers order it for 0đ.
          <span
            title="Điền giá trước (sửa sản phẩm, hoặc chọn nhiều rồi Đổi giá)"
            className="flex min-h-11 items-center px-2 font-mono text-xs uppercase tracking-wide text-graphite/60"
          >
            Hiện lại
          </span>
        ) : (
          <form action={toggleProductHiddenAction.bind(null, p.id)}>
            <button
              type="submit"
              className="flex min-h-11 cursor-pointer items-center px-2 font-mono text-xs uppercase tracking-wide text-graphite hover:text-ink hover:underline"
            >
              {p.hidden ? "Hiện lại" : "Ẩn"}
            </button>
          </form>
        )}

        <RowActions
          editHref={`/admin/products/${p.id}/edit`}
          deleteAction={linkedPosts > 0 ? undefined : deleteProductAction.bind(null, p.id)}
          deleteConfirmMessage={`Xóa sản phẩm "${p.name}"?`}
        />
      </div>
    </div>
  );
}

function ViewTabs({ active }: { active: "all" | "folder" }) {
  const tabClass = (isActive: boolean) =>
    "px-3 py-2 font-mono text-xs uppercase tracking-wide " +
    (isActive ? "border-b-2 border-ink text-ink" : "text-graphite hover:text-ink");
  return (
    <div className="mt-4 flex gap-2 border-b border-kraft-dark">
      <Link href="/admin/products" className={tabClass(active === "all")}>
        Tổng quan
      </Link>
      <Link href="/admin/products?view=folder" className={tabClass(active === "folder")}>
        Theo danh mục
      </Link>
    </div>
  );
}

// Quick filters above the list. "Chưa có ảnh" is also linked from the
// dashboard's to-do list; the other two are where the Yupoo import sends
// staff to price what it just brought in.
function FilterChips({ active, query }: { active: { noImage: boolean; noPrice: boolean; imported: boolean }; query?: string }) {
  const chips = [
    { key: "noPrice", label: "Chưa có giá" },
    { key: "imported", label: "Hàng nhập từ web" },
    { key: "noImage", label: "Chưa có ảnh" },
  ] as const;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {chips.map(({ key, label }) => {
        const on = active[key];
        const params = new URLSearchParams({
          ...(query ? { q: query } : {}),
          ...Object.fromEntries(
            chips.filter((c) => (c.key === key ? !on : active[c.key])).map((c) => [c.key, "1"])
          ),
        });
        return (
          <Link
            key={key}
            href={`/admin/products${params.size ? `?${params}` : ""}`}
            aria-pressed={on}
            className={
              "flex min-h-9 items-center border px-3 font-mono text-xs transition-colors " +
              (on ? "border-ink bg-ink text-paper" : "border-kraft-dark bg-paper text-ink hover:border-ink")
            }
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

async function AllProductsView({
  q,
  pageParam,
  store,
  noImage,
  noPrice,
  imported,
}: {
  q?: string;
  pageParam?: string;
  store: AdminStore;
  noImage: boolean;
  noPrice: boolean;
  imported: boolean;
}) {
  const query = q?.trim();
  const page = Math.max(1, Number(pageParam) || 1);
  const where = productListWhere({ store, q: query, noImage, noPrice, imported });
  const filterParams: Record<string, string> = {
    ...(query ? { q: query } : {}),
    ...(noImage ? { noImage: "1" } : {}),
    ...(noPrice ? { noPrice: "1" } : {}),
    ...(imported ? { imported: "1" } : {}),
  };

  const [linkedPosts, products, totalCount, sortOrderBounds] = await Promise.all([
    getSocialLinkedProducts(),
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
        department: true,
        categories: { select: { id: true, label: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    // Display order isn't scoped to this page's search/filter, so
    // "first"/"last" (for disabling the move buttons) has to be checked
    // against the whole store's sortOrder range, not just this page. (Each
    // store orders its own products — see moveProductAction.)
    prisma.product.aggregate({ where: storeWhere(store), _min: { sortOrder: true }, _max: { sortOrder: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const minSortOrder = sortOrderBounds._min.sortOrder ?? 0;
  const maxSortOrder = sortOrderBounds._max.sortOrder ?? 0;

  return (
    <>
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
      <FilterChips active={{ noImage, noPrice, imported }} query={query} />
      {(noImage || noPrice || imported) && (
        <p className="mt-2 font-mono text-xs text-graphite">
          Đang lọc: {totalCount} sản phẩm.{" "}
          <Link href="/admin/products" className="text-forest hover:underline">
            Bỏ lọc
          </Link>
        </p>
      )}

      <BulkBar filter={filterParams} totalCount={totalCount} />

      <div className="mt-6 flex flex-col gap-3">
        {(query || noImage || noPrice || imported) && products.length === 0 && (
          <p className="font-mono text-xs text-graphite">Không tìm thấy sản phẩm nào.</p>
        )}
        {products.map((p) => (
          <ProductRow
            key={p.id}
            p={p}
            minSortOrder={minSortOrder}
            maxSortOrder={maxSortOrder}
            linkedPosts={linkedPosts.get(p.id) ?? 0}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?${new URLSearchParams({ ...filterParams, page: String(p) })}`}
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
    </>
  );
}

async function FolderPicker({ store }: { store: AdminStore }) {
  const categories = await prisma.category.findMany({
    where: { parentId: null, ...storeWhere(store) },
    include: {
      children: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }], include: { _count: { select: { products: true } } } },
      _count: { select: { products: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="font-mono text-xs text-graphite">
        Chọn một danh mục để xem và sắp xếp riêng các sản phẩm bên trong.
      </p>
      {categories.map((cat) => (
        <div key={cat.id} className="die-cut flex flex-col gap-2 bg-paper p-4">
          <Link
            href={`/admin/products?view=folder&category=${cat.id}`}
            className="flex items-center justify-between gap-3 font-body text-base font-medium text-ink hover:text-forest"
          >
            <span className="flex items-center gap-2">
              {store === "ALL" && <StoreBadge department={cat.department} />}
              {cat.label}
            </span>
            <span className="font-mono text-xs text-graphite">{cat._count.products} sản phẩm →</span>
          </Link>
          {cat.children.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-kraft-dark pt-2 pl-4">
              {cat.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/admin/products?view=folder&category=${child.id}`}
                  className="flex items-center justify-between gap-3 font-body text-sm text-ink hover:text-forest"
                >
                  <span>— {child.label}</span>
                  <span className="font-mono text-xs text-graphite">{child._count.products} sản phẩm →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

async function FolderProductsView({
  categoryId,
  q,
  pageParam,
}: {
  categoryId: string;
  q?: string;
  pageParam?: string;
}) {
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, label: true } });
  if (!category) {
    return (
      <div className="mt-6">
        <p className="font-mono text-sm text-graphite">Không tìm thấy danh mục này.</p>
        <Link href="/admin/products?view=folder" className="mt-2 inline-block font-mono text-xs text-forest hover:underline">
          ← Tất cả danh mục
        </Link>
      </div>
    );
  }

  const query = q?.trim();
  const page = Math.max(1, Number(pageParam) || 1);
  const where = productListWhere({ store: "ALL", q: query, categoryId });

  const [linkedPosts, products, totalCount, sortOrderBounds] = await Promise.all([
    getSocialLinkedProducts(),
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
        department: true,
        categories: { select: { id: true, label: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    // Bounds scoped to this category only, so "first"/"last" (for disabling
    // move buttons) reflects position within the folder, not the whole
    // catalog — matches moveProductAction's own category-scoped sibling
    // lookup.
    prisma.product.aggregate({
      where: { categories: { some: { id: categoryId } } },
      _min: { sortOrder: true },
      _max: { sortOrder: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const minSortOrder = sortOrderBounds._min.sortOrder ?? 0;
  const maxSortOrder = sortOrderBounds._max.sortOrder ?? 0;

  const baseParams = { view: "folder", category: categoryId };

  return (
    <>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Link href="/admin/products?view=folder" className="font-mono text-xs text-graphite hover:text-ink hover:underline">
          ← Tất cả danh mục
        </Link>
        <p className="font-mono text-xs uppercase tracking-wide text-graphite">
          Danh mục: <span className="text-ink">{category.label}</span>
        </p>
      </div>

      <form role="search" action="/admin/products" className="relative mt-4 max-w-sm">
        <input type="hidden" name="view" value="folder" />
        <input type="hidden" name="category" value={categoryId} />
        <label htmlFor="folder-products-search" className="sr-only">
          Tìm sản phẩm trong danh mục
        </label>
        <input
          id="folder-products-search"
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
          <Link href={`/admin/products?view=folder&category=${categoryId}`} className="text-forest hover:underline">
            Xóa tìm kiếm
          </Link>
        </p>
      )}

      <BulkBar filter={{ category: categoryId, ...(query ? { q: query } : {}) }} totalCount={totalCount} />

      <div className="mt-6 flex flex-col gap-3">
        {products.length === 0 && (
          <p className="font-mono text-xs text-graphite">
            {query ? "Không tìm thấy sản phẩm nào." : "Danh mục này chưa có sản phẩm nào."}
          </p>
        )}
        {products.map((p) => (
          <ProductRow
            key={p.id}
            p={p}
            categoryId={categoryId}
            minSortOrder={minSortOrder}
            maxSortOrder={maxSortOrder}
            linkedPosts={linkedPosts.get(p.id) ?? 0}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?${new URLSearchParams({ ...baseParams, ...(query ? { q: query } : {}), page: String(p) })}`}
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
    </>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    view?: string;
    category?: string;
    noImage?: string;
    noPrice?: string;
    imported?: string;
  }>;
}) {
  const [{ q, page: pageParam, view, category: categoryId, noImage, noPrice, imported }, store] = await Promise.all([
    searchParams,
    getAdminStore(),
  ]);
  const isFolderView = view === "folder";

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Sản phẩm</h1>
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/admin/products/import"
            className="die-cut-flat cursor-pointer border border-ink bg-paper px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-kraft-dark/40"
          >
            Nhập từ web
          </Link>
          <Link
            href={store === "ALL" ? "/admin/products/new" : `/admin/products/new?department=${store}`}
            className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
          >
            + Thêm sản phẩm
          </Link>
        </div>
      </div>

      <ViewTabs active={isFolderView ? "folder" : "all"} />

      {isFolderView ? (
        categoryId ? (
          <FolderProductsView categoryId={categoryId} q={q} pageParam={pageParam} />
        ) : (
          <FolderPicker store={store} />
        )
      ) : (
        <AllProductsView
          q={q}
          pageParam={pageParam}
          store={store}
          noImage={noImage === "1"}
          noPrice={noPrice === "1"}
          imported={imported === "1"}
        />
      )}
    </div>
  );
}
