import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { deleteProductAction } from "./actions";
import { RowActions } from "@/components/admin/RowActions";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { categories: true },
    orderBy: { createdAt: "desc" },
  });

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

      <div className="mt-6 flex flex-col gap-3">
        {products.map((p) => {
          const images: string[] = JSON.parse(p.images || "[]");
          return (
            <div key={p.id} className="die-cut flex flex-wrap items-center gap-4 bg-paper p-3">
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

              <p className="shrink-0 font-mono text-sm font-semibold text-forest">{formatPrice(p.price)}</p>

              <RowActions
                editHref={`/admin/products/${p.id}/edit`}
                deleteAction={deleteProductAction.bind(null, p.id)}
                deleteConfirmMessage={`Xóa sản phẩm "${p.name}"?`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
