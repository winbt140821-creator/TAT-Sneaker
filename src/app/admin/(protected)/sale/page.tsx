import { prisma } from "@/lib/db";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { SaleCampaignForm } from "./SaleCampaignForm";
import { toggleSaleCampaignAction, deleteSaleCampaignAction } from "./actions";

export default async function AdminSalePage() {
  const [campaigns, products] = await Promise.all([
    prisma.saleCampaign.findMany({
      include: { products: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        images: true,
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
                <p className="font-body text-base font-medium text-ink">{c.name}</p>
                <span className="bg-forest px-1.5 py-0.5 font-mono text-[10px] font-bold text-paper">
                  -{c.discountPercent}%
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-graphite">
                {c.appliesToAll
                  ? "Áp dụng cho toàn bộ sản phẩm"
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
        <SaleCampaignForm products={productOptions} />
      </div>
    </div>
  );
}
