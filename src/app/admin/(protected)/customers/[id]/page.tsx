import { notFound } from "next/navigation";
import { AdminLink as Link } from "@/components/admin/AdminLink";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { ORDER_STATUS_LABEL as STATUS_LABEL, ORDER_STATUS_STYLE as STATUS_STYLE } from "@/lib/order-status";

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
};

// The full order list can grow unbounded for a long-time customer, and this
// page only shows recent activity (not a paginated ledger) — cap it and note
// the true total via _count instead of fetching every order + every item.
const RECENT_ORDERS_LIMIT = 50;

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      provider: true,
      createdAt: true,
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      orders: {
        select: {
          id: true,
          code: true,
          createdAt: true,
          status: true,
          items: { select: { price: true, quantity: true } },
        },
        orderBy: { createdAt: "desc" },
        take: RECENT_ORDERS_LIMIT,
      },
      _count: { select: { orders: true } },
    },
  });

  if (!customer) notFound();

  return (
    <div>
      <Link
        href="/admin/customers"
        className="font-mono text-xs uppercase tracking-wide text-graphite hover:text-ink hover:underline"
      >
        ← Tất cả khách hàng
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl text-ink">{customer.name || "Chưa đặt tên"}</h1>
        <span className="px-2 py-1 font-mono text-[10px] uppercase tracking-wide bg-kraft-dark/30 text-ink">
          {PROVIDER_LABEL[customer.provider] ?? customer.provider}
        </span>
      </div>
      <p className="font-mono text-xs text-graphite">{customer.email}</p>
      <p className="mt-1 font-mono text-xs text-graphite">
        Tham gia lúc {customer.createdAt.toLocaleString("vi-VN")}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-lg text-ink">Sổ địa chỉ</h2>
          <p className="mt-1 font-mono text-[10px] text-graphite">
            Đây là thông tin khách hàng tự cập nhật trong phần &quot;Tài khoản &gt; Địa chỉ&quot; của họ.
          </p>

          {customer.addresses.length === 0 ? (
            <p className="die-cut-flat mt-4 bg-kraft p-6 text-center font-mono text-sm text-graphite">
              Khách chưa lưu địa chỉ nào.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {customer.addresses.map((addr) => (
                <div key={addr.id} className="die-cut bg-paper p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-body text-sm font-semibold text-ink">{addr.fullName}</p>
                    {addr.isDefault && (
                      <span className="bg-forest px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-paper">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-xs text-graphite">{addr.phone}</p>
                  {addr.company && <p className="font-mono text-xs text-graphite">{addr.company}</p>}
                  <p className="mt-1 font-body text-sm text-ink">
                    {[addr.address, addr.ward, addr.province].filter(Boolean).join(", ")}
                    {addr.zip ? ` (${addr.zip})` : ""}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-graphite">
                    Cập nhật lúc {addr.createdAt.toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg text-ink">Lịch sử đơn hàng</h2>
          {customer._count.orders > customer.orders.length && (
            <p className="mt-1 font-mono text-[10px] text-graphite">
              Hiển thị {customer.orders.length} đơn gần nhất trên tổng {customer._count.orders} đơn.
            </p>
          )}

          {customer.orders.length === 0 ? (
            <p className="die-cut-flat mt-4 bg-kraft p-6 text-center font-mono text-sm text-graphite">
              Khách chưa có đơn hàng nào.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {customer.orders.map((order) => {
                const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="die-cut flex flex-wrap items-center justify-between gap-3 bg-paper p-4 transition-colors hover:bg-kraft-dark/10"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-ink">{order.code}</p>
                      <p className="font-mono text-xs text-graphite">
                        {order.createdAt.toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="font-mono text-sm font-semibold text-forest">
                        {formatPrice(total)}
                      </p>
                      <span
                        className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLE[order.status]}`}
                      >
                        {STATUS_LABEL[order.status]}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
