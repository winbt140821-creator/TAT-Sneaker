import { notFound } from "next/navigation";
import { AdminLink as Link } from "@/components/admin/AdminLink";
import { prisma } from "@/lib/db";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import {
  addSizeChartRowAction,
  deleteSizeChartRowAction,
  useDefaultSizeChartAction,
} from "./actions";

export default async function CategorySizeChartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { sizeChartRows: { orderBy: { sortOrder: "asc" } } },
  });

  if (!category) notFound();

  return (
    <div>
      <Link
        href="/admin/categories"
        className="font-mono text-xs uppercase tracking-wide text-graphite hover:text-ink hover:underline"
      >
        ← Danh mục
      </Link>

      <h1 className="mt-2 font-display text-2xl text-ink">
        Bảng size — {category.label}
      </h1>
      <p className="mt-1 font-mono text-xs text-graphite">
        Bảng này hiển thị trên trang chi tiết của mọi sản phẩm thuộc hãng &quot;{category.label}&quot;.
        Chưa tùy chỉnh thì trang sản phẩm sẽ tự dùng bảng mặc định.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {category.sizeChartRows.length === 0 && (
          <p className="font-mono text-xs text-graphite">
            Hãng này đang dùng bảng size mặc định (chưa tùy chỉnh).
          </p>
        )}
        {category.sizeChartRows.length > 0 && (
          <div className="die-cut overflow-x-auto bg-paper p-4">
            <table className="w-full min-w-[420px] border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-kraft-dark text-graphite">
                  <th className="py-1.5 text-left font-semibold">VN</th>
                  <th className="py-1.5 text-left font-semibold">US</th>
                  <th className="py-1.5 text-left font-semibold">UK</th>
                  <th className="py-1.5 text-left font-semibold">CM</th>
                  <th className="py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {category.sizeChartRows.map((row) => (
                  <tr key={row.id} className="border-b border-kraft-dark/50 text-ink">
                    <td className="py-1.5">{row.vnSize}</td>
                    <td className="py-1.5">{row.usSize}</td>
                    <td className="py-1.5">{row.ukSize}</td>
                    <td className="py-1.5">{row.cmSize}</td>
                    <td className="py-1.5 text-right">
                      <form action={deleteSizeChartRowAction.bind(null, category.id, row.id)}>
                        <button
                          type="submit"
                          className="cursor-pointer p-2 text-xs uppercase tracking-wide text-stamp hover:underline"
                        >
                          Xóa
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form action={addSizeChartRowAction.bind(null, category.id)} className="die-cut-flat mt-6 flex flex-wrap items-end gap-3 bg-kraft p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="vnSize" className="font-mono text-xs uppercase tracking-wide text-graphite">VN</label>
          <input id="vnSize" name="vnSize" required placeholder="39" className="w-20 border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="usSize" className="font-mono text-xs uppercase tracking-wide text-graphite">US</label>
          <input id="usSize" name="usSize" required placeholder="6.5" className="w-20 border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ukSize" className="font-mono text-xs uppercase tracking-wide text-graphite">UK</label>
          <input id="ukSize" name="ukSize" required placeholder="5.5" className="w-20 border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cmSize" className="font-mono text-xs uppercase tracking-wide text-graphite">CM</label>
          <input id="cmSize" name="cmSize" required placeholder="24.5" className="w-20 border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest" />
        </div>
        <button
          type="submit"
          className="h-fit cursor-pointer bg-ink px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          + Thêm dòng
        </button>
      </form>

      <form action={useDefaultSizeChartAction.bind(null, category.id)} className="mt-4">
        <ConfirmSubmitButton
          label="Dùng bảng mặc định (ghi đè)"
          confirmMessage="Thao tác này sẽ xóa toàn bộ dòng đang có và thay bằng bảng mặc định. Tiếp tục?"
          className="cursor-pointer font-mono text-xs uppercase tracking-wide text-graphite hover:text-ink hover:underline"
        />
      </form>
    </div>
  );
}
