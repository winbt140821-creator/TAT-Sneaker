import { AdminLink as Link } from "@/components/admin/AdminLink";
import { StoreBadge } from "@/components/admin/StoreBadge";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { getRevenueTotals } from "@/lib/revenue";
import { getStockSummary } from "@/lib/stock-summary";
import { autoCancelStaleOrders } from "@/lib/order-cleanup";
import { getAdminStore, orderStoreWhere, STORE_LABEL } from "@/lib/admin-store";
import { FOOTER_PAGES } from "@/lib/footer-pages";
import type { Department } from "@/lib/inventory";
import { ORDER_STATUS_LABEL as STATUS_LABEL, ORDER_STATUS_STYLE as STATUS_STYLE } from "@/lib/order-status";
import { OrderStatus } from "@/generated/prisma/client";

type Todo = { text: string; href: string; action: string; department?: Department };

async function storeStats(department: Department, startOfToday: Date, startOfMonth: Date, now: Date) {
  const [today, month, productCount, pendingOrders, stock] = await Promise.all([
    getRevenueTotals(startOfToday, now, department),
    getRevenueTotals(startOfMonth, now, department),
    prisma.product.count({ where: { department, hidden: false } }),
    prisma.order.count({ where: { status: "PENDING", ...orderStoreWhere(department) } }),
    getStockSummary(department),
  ]);
  return { department, today: today.done, month: month.done, productCount, pendingOrders, outOfStock: stock.outOfStockCount };
}

// Things that make a store look unfinished to customers, found automatically
// so nobody has to remember them: no cover photo, products without photos,
// category tiles without a picture, footer links to pages that don't exist.
async function storeTodos(department: Department): Promise<Todo[]> {
  const label = STORE_LABEL[department];
  const [branding, visibleProducts, productsWithoutPhotos, categoriesWithoutPhoto] = await Promise.all([
    prisma.storefrontBranding.findUnique({ where: { department }, select: { heroImages: true, heroImageUrl: true } }),
    prisma.product.count({ where: { department, hidden: false } }),
    prisma.product.count({ where: { department, hidden: false, images: "[]" } }),
    // Clothing shows every top-level category that has a photo as a tile;
    // shoes only the ones switched on for the homepage showcase.
    prisma.category.count({
      where: {
        department,
        parentId: null,
        showcaseImageUrl: null,
        ...(department === "SHOES" ? { showcaseEnabled: true } : {}),
      },
    }),
  ]);
  const hasCover = Boolean(branding?.heroImageUrl) || (branding?.heroImages ? JSON.parse(branding.heroImages).length > 0 : false);

  const todos: Todo[] = [];
  if (visibleProducts === 0) {
    todos.push({ department, text: `Cửa hàng ${label} chưa có sản phẩm nào đang bán.`, href: "/admin/products/new", action: "Thêm sản phẩm" });
  }
  if (!hasCover) {
    todos.push({
      department,
      text: `Cửa hàng ${label} chưa có ảnh bìa — trang chủ và trang giới thiệu đang dùng nền trơn.`,
      href: `/admin/settings/trang-chu?department=${department}`,
      action: "Tải ảnh bìa",
    });
  }
  if (productsWithoutPhotos > 0) {
    todos.push({
      department,
      text: `${productsWithoutPhotos} sản phẩm ${label.toLowerCase()} chưa có ảnh.`,
      href: "/admin/products?noImage=1",
      action: "Xem danh sách",
    });
  }
  if (categoriesWithoutPhoto > 0) {
    todos.push({
      department,
      text: `${categoriesWithoutPhoto} danh mục ${label.toLowerCase()} chưa có ảnh đại diện.`,
      href: `/admin/categories?department=${department}`,
      action: "Thêm ảnh",
    });
  }
  return todos;
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const store = await getAdminStore();
  const departments: Department[] = store === "ALL" ? ["SHOES", "CLOTHING"] : [store];

  // Run alongside the page's own reads instead of awaiting it first — this
  // is a background hygiene sweep, not data the page depends on, and every
  // extra round trip before the real queries even start is pure added
  // latency against a remote (Turso) database. A stale order that gets
  // cancelled mid-render just shows its old status until the next reload.
  const [, stats, todosByStore, existingPages, statusCounts, recentOrders] = await Promise.all([
    autoCancelStaleOrders(),
    Promise.all(departments.map((d) => storeStats(d, startOfToday, startOfMonth, now))),
    Promise.all(departments.map(storeTodos)),
    prisma.staticPage.findMany({ select: { slug: true } }),
    prisma.order.groupBy({ by: ["status"], where: orderStoreWhere(store), _count: true }),
    prisma.order.findMany({
      where: orderStoreWhere(store),
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: { select: { price: true, quantity: true, product: { select: { department: true } } } } },
    }),
  ]);

  const existing = new Set(existingPages.map((p) => p.slug));
  const todos: Todo[] = [
    ...stats
      .filter((s) => s.pendingOrders > 0)
      .map((s) => ({
        department: s.department,
        text: `${s.pendingOrders} đơn ${STORE_LABEL[s.department].toLowerCase()} đang chờ xác nhận.`,
        href: "/admin/orders?status=PENDING",
        action: "Xử lý",
      })),
    ...todosByStore.flat(),
    ...FOOTER_PAGES.filter((p) => !existing.has(p.slug)).map((p) => ({
      text: `Chân trang có link "${p.title}" nhưng trang này chưa được tạo — khách bấm vào sẽ gặp trang lỗi.`,
      href: `/admin/pages/new?slug=${p.slug}&title=${encodeURIComponent(p.title)}`,
      action: "Tạo trang",
    })),
  ];

  const countByStatus = Object.fromEntries(statusCounts.map((c) => [c.status, c._count])) as Partial<
    Record<OrderStatus, number>
  >;
  const total = { today: stats.reduce((n, s) => n + s.today, 0), month: stats.reduce((n, s) => n + s.month, 0) };

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Tổng quan</h1>

      <div className={"mt-6 grid gap-4 " + (stats.length > 1 ? "lg:grid-cols-2" : "")}>
        {stats.map((s) => (
          <section key={s.department} className="die-cut bg-paper p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-lg text-ink">
                <StoreBadge department={s.department} />
                Cửa hàng {STORE_LABEL[s.department].toLowerCase()}
              </h2>
              <a
                href={s.department === "SHOES" ? "/giay" : "/quan-ao"}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] uppercase tracking-wide text-graphite hover:text-ink hover:underline"
              >
                Xem ↗
              </a>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              {[
                { label: "Doanh thu hôm nay", value: formatPrice(s.today), href: "/admin/revenue?range=7d" },
                { label: "Doanh thu tháng này", value: formatPrice(s.month), href: "/admin/revenue?range=30d" },
                { label: "Đơn chờ xác nhận", value: s.pendingOrders, href: "/admin/orders?status=PENDING" },
                { label: "Sản phẩm đang bán", value: s.productCount, href: "/admin/products" },
                { label: "Hết hàng", value: s.outOfStock, href: "/admin/inventory" },
              ].map((c) => (
                <div key={c.label}>
                  <dt className="font-mono text-[10px] uppercase tracking-wide text-graphite">{c.label}</dt>
                  <dd className="mt-1">
                    <Link href={c.href} className="font-display text-2xl text-ink hover:underline">
                      {c.value}
                    </Link>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {stats.length > 1 && (
        <p className="mt-3 font-mono text-xs text-graphite">
          Tổng hai cửa hàng (đơn hoàn tất): hôm nay <span className="font-semibold text-ink">{formatPrice(total.today)}</span> · tháng
          này <span className="font-semibold text-ink">{formatPrice(total.month)}</span>
        </p>
      )}

      <h2 className="mt-8 font-display text-lg text-ink">Cần làm</h2>
      {todos.length === 0 ? (
        <p className="mt-3 font-mono text-sm text-graphite">Không có việc gì còn thiếu. Cửa hàng đã sẵn sàng.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {todos.map((todo, i) => (
            <li key={i} className="die-cut-flat flex flex-wrap items-center gap-3 bg-paper px-4 py-3">
              {todo.department && <StoreBadge department={todo.department} />}
              <p className="min-w-0 flex-1 font-body text-sm text-ink">{todo.text}</p>
              <Link
                href={todo.href}
                className="shrink-0 bg-ink px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-ink-soft"
              >
                {todo.action}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 font-display text-lg text-ink">Đơn hàng theo trạng thái</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.values(OrderStatus).map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className="die-cut-flat flex items-center gap-2 bg-paper px-3 py-2 transition-colors hover:bg-kraft-dark/20"
          >
            <span className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLE[s]}`}>
              {STATUS_LABEL[s]}
            </span>
            <span className="font-mono text-sm font-semibold text-ink">{countByStatus[s] ?? 0}</span>
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
        {recentOrders.length === 0 && <p className="font-mono text-sm text-graphite">Chưa có đơn hàng nào.</p>}
        {recentOrders.map((order) => {
          const orderTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const orderStores = [...new Set(order.items.map((i) => i.product.department))];
          return (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="die-cut flex flex-col gap-1 bg-paper p-4 transition-colors hover:bg-kraft-dark/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-mono text-sm font-semibold text-ink">
                  {order.code}
                  {orderStores.map((d) => (
                    <StoreBadge key={d} department={d} />
                  ))}
                </p>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="font-mono text-sm font-semibold text-forest">{formatPrice(orderTotal)}</p>
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
