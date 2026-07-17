import { AdminLink as Link } from "@/components/admin/AdminLink";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { autoCancelStaleOrders } from "@/lib/order-cleanup";
import { ORDER_STATUS_LABEL as STATUS_LABEL, ORDER_STATUS_STYLE as STATUS_STYLE } from "@/lib/order-status";
import { attributionLabel } from "@/lib/order-attribution";
import { OrderStatus } from "@/generated/prisma/client";
import { deleteOrderAction } from "./actions";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COD: "COD",
  VNPAY: "VNPay",
  PAYPAL: "PayPal",
  BANK_TRANSFER: "Chuyển khoản",
};

const PAGE_SIZE = 20;

const ORDER_LIST_SELECT = {
  id: true,
  code: true,
  customerName: true,
  customerPhone: true,
  status: true,
  paymentMethod: true,
  depositAmount: true,
  depositPaid: true,
  utmSource: true,
  utmCampaign: true,
  fbclid: true,
  items: { select: { price: true, quantity: true } },
} as const;

type OrderListRow = { depositAmount: number; items: { price: number; quantity: number }[] };

function isFullPaymentOrder(order: OrderListRow): boolean {
  const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return total > 0 && order.depositAmount >= total;
}

// Orders where staff still need to reach out (Zalo, phone, whichever the
// shop actually uses) to collect the deposit — see codOptionNote in
// Settings. "COD" (nothing charged at all) and paid-in-full orders don't
// need this manual follow-up. A deposit is only ever collected via bank
// transfer in the checkout UI (see CheckoutForm's "COD" radio — its
// provider defaults to BANK_TRANSFER, and PayPal always implies paying in
// full), so paymentMethod alone gets close, but "paid in full via bank
// transfer" also matches that filter — isFullPaymentOrder() (mirroring the
// per-row badge logic below) is what actually excludes those, hence the
// in-memory filter rather than a single Prisma `where`.
const PENDING_ZALO_DEPOSIT_CANDIDATE_WHERE = {
  paymentMethod: "BANK_TRANSFER",
  depositAmount: { gt: 0 },
  depositPaid: false,
} as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; zaloDeposit?: string }>;
}) {
  // Kicked off without awaiting yet so this background hygiene sweep
  // overlaps with the searchParams/where-building work and the main queries
  // below instead of adding its own round trip in front of them — see the
  // same tradeoff note in src/app/admin/(protected)/page.tsx.
  const cleanupPromise = autoCancelStaleOrders();

  const { status, q, page: pageParam, zaloDeposit } = await searchParams;
  const activeStatus = Object.values(OrderStatus).includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;
  const zaloDepositOnly = zaloDeposit === "1";
  const query = q?.trim();
  const page = Math.max(1, Number(pageParam) || 1);

  // Lets staff match a bank transfer (identified by order code or the
  // customer's name/phone in the transfer note) back to the actual order.
  const searchWhere = query
    ? {
        OR: [
          { code: { contains: query } },
          { customerName: { contains: query } },
          { customerPhone: { contains: query } },
        ],
      }
    : {};
  const where = { ...(activeStatus ? { status: activeStatus } : {}), ...searchWhere };

  // The global count badge on the quick-filter button always reflects every
  // pending Zalo-deposit order, independent of the status/search filters
  // currently applied to the main list below.
  const [, allZaloDepositCandidates, counts] = await Promise.all([
    cleanupPromise,
    prisma.order.findMany({ where: PENDING_ZALO_DEPOSIT_CANDIDATE_WHERE, select: ORDER_LIST_SELECT }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const pendingZaloDepositCount = allZaloDepositCandidates.filter((o) => !isFullPaymentOrder(o)).length;

  let orders: (typeof allZaloDepositCandidates)[number][];
  let totalCount: number;
  if (zaloDepositOnly) {
    // Same "not actually paid in full" filter as above, but scoped to the
    // current status/search filters, then paginated in memory — the
    // deposit-vs-total comparison can't be pushed into a Prisma `where`.
    const candidates = activeStatus || query
      ? await prisma.order.findMany({
          where: { ...PENDING_ZALO_DEPOSIT_CANDIDATE_WHERE, ...where },
          select: ORDER_LIST_SELECT,
          orderBy: { createdAt: "desc" },
        })
      : allZaloDepositCandidates;
    const filtered = candidates.filter((o) => !isFullPaymentOrder(o));
    totalCount = filtered.length;
    orders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else {
    [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        select: ORDER_LIST_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.order.count({ where }),
    ]);
  }
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const allOrdersCount = counts.reduce((sum, c) => sum + c._count, 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Đơn hàng</h1>

      <form action="/admin/orders" method="GET" className="mt-4 flex max-w-md gap-2">
        {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
        <input
          type="text"
          name="q"
          defaultValue={query ?? ""}
          placeholder="Tìm theo mã đơn, tên hoặc SĐT khách..."
          className="die-cut-flat flex-1 bg-paper px-3 py-2 text-sm text-ink"
        />
        <button
          type="submit"
          className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          Tìm
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={
            "die-cut-flat cursor-pointer px-3 py-1.5 font-mono text-xs uppercase tracking-wide " +
            (!activeStatus ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-kraft-dark/30")
          }
        >
          Tất cả ({allOrdersCount})
        </Link>
        {Object.values(OrderStatus).map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={
              "die-cut-flat cursor-pointer px-3 py-1.5 font-mono text-xs uppercase tracking-wide " +
              (activeStatus === s ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-kraft-dark/30")
            }
          >
            {STATUS_LABEL[s]} ({countByStatus[s] ?? 0})
          </Link>
        ))}
        <Link
          href={zaloDepositOnly ? "/admin/orders" : "/admin/orders?zaloDeposit=1"}
          className={
            "die-cut-flat cursor-pointer px-3 py-1.5 font-mono text-xs uppercase tracking-wide " +
            (zaloDepositOnly ? "bg-stamp text-paper" : "bg-paper text-stamp hover:bg-kraft-dark/30")
          }
        >
          Chờ cọc qua Zalo ({pendingZaloDepositCount})
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {orders.length === 0 && (
          <p className="font-mono text-sm text-graphite">
            {query ? "Không tìm thấy đơn hàng phù hợp." : "Chưa có đơn hàng nào."}
          </p>
        )}
        {orders.map((order) => {
          const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const isFullPayment = isFullPaymentOrder(order);
          return (
            <div
              key={order.id}
              className="die-cut flex flex-col gap-2 bg-paper p-4 transition-colors hover:bg-kraft-dark/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-mono text-sm font-semibold text-ink hover:underline"
                >
                  {order.code}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="shrink-0 font-mono text-xs text-graphite">
                    {order.items.length} sản phẩm
                  </p>
                  <p className="shrink-0 font-mono text-sm font-semibold text-forest">
                    {formatPrice(total)}
                  </p>
                  <span
                    className={`shrink-0 px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLE[order.status]}`}
                  >
                    {STATUS_LABEL[order.status]}
                  </span>
                  <span className="shrink-0 px-2 py-1 font-mono text-[10px] uppercase tracking-wide bg-kraft-dark/30 text-ink">
                    {PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
                  </span>
                  {order.depositAmount > 0 && (
                    <span
                      className={`shrink-0 px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${
                        order.depositPaid ? "bg-forest text-paper" : "bg-stamp text-paper"
                      }`}
                    >
                      {order.depositPaid
                        ? (isFullPayment ? "Đã thanh toán" : "Đã cọc")
                        : isFullPayment
                          ? "Chờ thanh toán"
                          : "Chờ cọc qua Zalo"}
                    </span>
                  )}
                  {order.status === "CANCELLED" && (
                    <form action={deleteOrderAction.bind(null, order.id)}>
                      <ConfirmSubmitButton
                        label="Xóa"
                        confirmMessage={`Xóa vĩnh viễn đơn hàng ${order.code}? Không thể hoàn tác.`}
                        className="shrink-0 cursor-pointer px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-stamp hover:underline"
                      />
                    </form>
                  )}
                </div>
              </div>
              <Link
                href={`/admin/orders/${order.id}`}
                className="truncate font-body text-sm text-graphite hover:text-ink"
              >
                {order.customerName} · {order.customerPhone}
              </Link>
              {attributionLabel(order) && (
                <p className="font-mono text-[11px] text-graphite">
                  Nguồn: <span className="text-forest">{attributionLabel(order)}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?${new URLSearchParams({
                ...(activeStatus ? { status: activeStatus } : {}),
                ...(query ? { q: query } : {}),
                page: String(p),
              })}`}
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
