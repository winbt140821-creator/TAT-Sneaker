import { prisma } from "@/lib/db";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { SaleCampaignForm } from "./SaleCampaignForm";
import { toggleSaleCampaignAction, deleteSaleCampaignAction } from "./actions";
import { StoreBadge } from "@/components/admin/StoreBadge";
import { getAdminStore } from "@/lib/admin-store";

export default async function AdminSalePage() {
  const store = await getAdminStore();
  const [campaigns, products] = await Promise.all([
    prisma.saleCampaign.findMany({
      // Managing one store: campaigns that can discount it — its own, the
      // both-stores ones, and hand-picked lists that include its products.
      where:
        store === "ALL"
          ? {}
          : {
              OR: [
                { appliesToAll: true, department: null },
                { appliesToAll: true, department: store },
                { appliesToAll: false, products: { some: { department: store } } },
              ],
            },
      include: { products: { select: { id: true, name: true, department: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        images: true,
        department: true,
        categories: { select: { id: true, label: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    image: (JSON.parse(p.images || "[]") as string[])[0] ?? null,
    department: p.department,
    categories: p.categories,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sale &amp; Khuyến mãi</h1>
      <p className="mt-1 font-mono text-xs text-graphite">
        Bật một đợt để tự động giảm giá — toàn bộ sản phẩm hoặc danh sách đã chọn — không cần sửa từng sản phẩm.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {campaigns.length === 0 && (
          <p className="font-mono text-sm text-graphite">Chưa có đợt giảm giá nào.</p>
        )}
        {campaigns.map((c) => (
          <div key={c.id} className="die-cut flex flex-wrap items-center justify-between gap-3 bg-paper p-4">
            <div>
              <div className="flex items-center gap-2">
                {(c.appliesToAll
                  ? c.department
                    ? [c.department]
                    : (["SHOES", "CLOTHING"] as const)
                  : [...new Set(c.products.map((p) => p.department))]
                ).map((d) => (
                  <StoreBadge key={d} department={d} />
                ))}
                <p className="font-body text-base font-medium text-ink">{c.name}</p>
                <span className="bg-forest px-1.5 py-0.5 font-mono text-[10px] font-bold text-paper">
                  -{c.discountPercent}%
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-graphite">
                {c.appliesToAll
                  ? c.department
                    ? `Áp dụng cho toàn bộ sản phẩm ${c.department === "SHOES" ? "giày" : "quần áo"}`
                    : "Áp dụng cho toàn bộ sản phẩm của cả hai cửa hàng"
                  : `Áp dụng cho ${c.products.length} sản phẩm đã chọn`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <form action={toggleSaleCampaignAction.bind(null, c.id)}>
                <button
                  type="submit"
                  className={
                    "cursor-pointer px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-paper transition-colors " +
                    (c.active ? "bg-forest hover:bg-forest-dark" : "bg-graphite hover:bg-ink")
                  }
                >
                  {c.active ? "Đang bật" : "Đang tắt"}
                </button>
              </form>
              <form action={deleteSaleCampaignAction.bind(null, c.id)}>
                <ConfirmSubmitButton
                  label="Xóa"
                  confirmMessage={`Xóa đợt giảm giá "${c.name}"?`}
                  className="flex min-h-11 cursor-pointer items-center px-2 font-mono text-xs uppercase tracking-wide text-stamp hover:underline"
                />
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <SaleCampaignForm products={productOptions} defaultStore={store === "ALL" ? null : store} />
      </div>
    </div>
  );
}
