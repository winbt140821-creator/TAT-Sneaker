import Link from "next/link";
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await autoCancelStaleOrders();

  const { status, q } = await searchParams;
  const activeStatus = Object.values(OrderStatus).includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;
  const query = q?.trim();

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

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: { ...(activeStatus ? { status: activeStatus } : {}), ...searchWhere },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const totalCount = counts.reduce((sum, c) => sum + c._count, 0);

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
          Tất cả ({totalCount})
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
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {orders.length === 0 && (
          <p className="font-mono text-sm text-graphite">
            {query ? "Không tìm thấy đơn hàng phù hợp." : "Chưa có đơn hàng nào."}
          </p>
        )}
        {orders.map((order) => {
          const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const isFullPayment = order.paymentMethod !== "COD" && order.depositAmount >= total && total > 0;
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
                        : (isFullPayment ? "Chờ thanh toán" : "Chờ cọc")}
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
    </div>
  );
}
