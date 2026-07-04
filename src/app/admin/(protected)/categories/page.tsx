import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteCategoryAction } from "./actions";
import { RowActions } from "@/components/admin/RowActions";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { children: { orderBy: { sortOrder: "asc" } }, _count: { select: { products: true } } },
    where: { parentId: null },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Danh mục</h1>
        <Link
          href="/admin/categories/new"
          className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          + Thêm danh mục
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {categories.map((cat) => (
          <div key={cat.id} className="die-cut bg-paper p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="font-body text-base font-medium text-ink">{cat.label}</p>
                <span className="font-mono text-xs text-graphite">/{cat.slug}</span>
                {cat.hot && (
                  <span className="bg-stamp px-1.5 py-0.5 font-mono text-[10px] uppercase text-paper">hot</span>
                )}
                {cat.sale && (
                  <span className="bg-ink px-1.5 py-0.5 font-mono text-[10px] uppercase text-paper">sale</span>
                )}
                <span className="font-mono text-xs text-graphite">
                  {cat._count.products} sản phẩm
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/categories/new?parentId=${cat.id}`}
                  className="font-mono text-xs uppercase tracking-wide text-graphite hover:text-ink hover:underline"
                >
                  + Danh mục con
                </Link>
                <Link
                  href={`/admin/categories/${cat.id}/size-chart`}
                  className="font-mono text-xs uppercase tracking-wide text-graphite hover:text-ink hover:underline"
                >
                  Bảng size
                </Link>
                <RowActions
                  editHref={`/admin/categories/${cat.id}/edit`}
                  deleteAction={deleteCategoryAction.bind(null, cat.id)}
                  deleteConfirmMessage={`Xóa danh mục "${cat.label}"? Danh mục con bên trong cũng sẽ bị xóa.`}
                />
              </div>
            </div>

            {cat.children.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5 border-t border-kraft-dark pt-3">
                {cat.children.map((child) => (
                  <li
                    key={child.id}
                    className="flex flex-wrap items-center justify-between gap-2 pl-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm text-ink">— {child.label}</span>
                      <span className="font-mono text-[11px] text-graphite">/{child.slug}</span>
                    </div>
                    <RowActions
                      editHref={`/admin/categories/${child.id}/edit`}
                      deleteAction={deleteCategoryAction.bind(null, child.id)}
                      deleteConfirmMessage={`Xóa danh mục "${child.label}"?`}
                      compact
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
