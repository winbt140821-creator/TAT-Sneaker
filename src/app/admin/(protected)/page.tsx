import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { getRevenueTotals } from "@/lib/revenue";
import { getStockSummary } from "@/lib/stock-summary";
import { autoCancelStaleOrders } from "@/lib/order-cleanup";
import { ORDER_STATUS_LABEL as STATUS_LABEL, ORDER_STATUS_STYLE as STATUS_STYLE } from "@/lib/order-status";
import { OrderStatus } from "@/generated/prisma/client";

export default async function AdminDashboardPage() {
  await autoCancelStaleOrders();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    productCount,
    categoryCount,
    totalOrders,
    statusCounts,
    revenueToday,
    revenueMonth,
    recentOrders,
    { outOfStockCount },
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count({ where: { parentId: null } }),
    prisma.order.count(),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    getRevenueTotals(startOfToday, now),
    getRevenueTotals(startOfMonth, now),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
    getStockSummary(),
  ]);

  const countByStatus = Object.fromEntries(
    statusCounts.map((c) => [c.status, c._count])
  ) as Partial<Record<OrderStatus, number>>;

  const cards = [
    { label: "Sản phẩm", value: productCount, href: "/admin/products" },
    { label: "Danh mục", value: categoryCount, href: "/admin/categories" },
    { label: "Tổng đơn hàng", value: totalOrders, href: "/admin/orders" },
    { label: "Sản phẩm hết hàng", value: outOfStockCount, href: "/admin/inventory" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Tổng quan</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="die-cut bg-paper p-5 transition-colors hover:bg-kraft-dark/20"
          >
            <p className="font-display text-3xl text-ink">{c.value}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-graphite">
              {c.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/revenue"
          className="die-cut bg-forest p-5 transition-colors hover:bg-forest-dark"
        >
          <p className="font-display text-2xl text-paper">{formatPrice(revenueToday.done)}</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-wide text-paper/80">
            Doanh thu hôm nay (đơn hoàn tất)
          </p>
        </Link>
        <Link
          href="/admin/revenue"
          className="die-cut bg-paper p-5 transition-colors hover:bg-kraft-dark/20"
        >
          <p className="font-display text-2xl text-ink">{formatPrice(revenueMonth.done)}</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-wide text-graphite">
            Doanh thu tháng này (đơn hoàn tất)
          </p>
        </Link>
      </div>

      <h2 className="mt-8 font-display text-lg text-ink">Đơn hàng theo trạng thái</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.values(OrderStatus).map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className="die-cut-flat flex items-center gap-2 bg-paper px-3 py-2 transition-colors hover:bg-kraft-dark/20"
          >
            <span
              className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLE[s]}`}
            >
              {STATUS_LABEL[s]}
            </span>
            <span className="font-mono text-sm font-semibold text-ink">
              {countByStatus[s] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Đơn hàng gần đây</h2>
        <Link
          href="/admin/orders"
          className="font-mono text-xs uppercase tracking-wide text-graphite hover:text-ink hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {recentOrders.length === 0 && (
          <p className="font-mono text-sm text-graphite">Chưa có đơn hàng nào.</p>
        )}
        {recentOrders.map((order) => {
          const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="die-cut flex flex-col gap-1 bg-paper p-4 transition-colors hover:bg-kraft-dark/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-sm font-semibold text-ink">{order.code}</p>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="font-mono text-sm font-semibold text-forest">
                    {formatPrice(total)}
                  </p>
                  <span
                    className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLE[order.status]}`}
                  >
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
              </div>
              <p className="truncate font-body text-sm text-graphite">
                {order.customerName} · {order.customerPhone}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
