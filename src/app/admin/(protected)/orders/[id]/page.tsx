import { notFound } from "next/navigation";
import { AdminLink as Link } from "@/components/admin/AdminLink";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { OrderStatus } from "@/generated/prisma/client";
import { ORDER_STATUS_LABEL as STATUS_LABEL } from "@/lib/order-status";
import { attributionLabel } from "@/lib/order-attribution";
import {
  updateOrderStatusAction,
  setOrderDepositPaidAction,
  setTrackingCodeAction,
  syncShippingStatusAction,
} from "../actions";
import { CopyShipmentInfoButton } from "./CopyShipmentInfoButton";

const PAYMENT_PROVIDER_LABEL: Record<string, string> = {
  VNPAY: "VNPay",
  PAYPAL: "PayPal",
  BANK_TRANSFER: "Chuyển khoản",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  VNPAY: "VNPay",
  PAYPAL: "PayPal",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Đang chờ",
  SUCCEEDED: "Thành công",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-graphite text-paper",
  SUCCEEDED: "bg-forest text-paper",
  FAILED: "bg-stamp text-paper",
  CANCELLED: "bg-stamp text-paper",
};

function formatPaymentAmount(amount: number, currency: string): string {
  if (currency === "USD") {
    return (amount / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  return formatPrice(amount);
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, sku: true } } } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const isFullPayment = order.paymentMethod !== "COD" && order.depositAmount >= total && total > 0;
  const paymentMethodLabel = PAYMENT_METHOD_LABEL[order.paymentMethod] ?? PAYMENT_METHOD_LABEL.COD;
  const fullAddress = order.province && order.ward
    ? `${order.address}, ${order.ward}, ${order.province}`
    : order.address;

  const codAmount = order.paymentMethod === "COD" ? total - order.depositAmount : 0;
  const shipmentInfoText = [
    `Mã đơn hàng: ${order.code}`,
    `Người nhận: ${order.customerName}`,
    `Điện thoại: ${order.customerPhone}`,
    `Địa chỉ: ${fullAddress}`,
    `Thu hộ (COD): ${codAmount > 0 ? formatPrice(codAmount) : "0đ (đã thanh toán)"}`,
    `Hàng hoá: ${order.items.map((i) => `${i.product.name} (size ${i.size}) x${i.quantity}`).join(", ")}`,
    order.note ? `Ghi chú: ${order.note}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div>
      <Link
        href="/admin/orders"
        className="font-mono text-xs uppercase tracking-wide text-graphite hover:text-ink hover:underline"
      >
        ← Tất cả đơn hàng
      </Link>

      <h1 className="mt-2 font-display text-2xl text-ink">Đơn hàng {order.code}</h1>
      <p className="font-mono text-xs text-graphite">
        Đặt lúc {order.createdAt.toLocaleString("vi-VN")}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="die-cut flex flex-col gap-3 bg-paper p-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 border-b border-kraft-dark pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium text-ink">{item.product.name}</p>
                  <p className="font-mono text-xs text-graphite">
                    SKU {item.product.sku} · Size {item.size} × {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold text-forest">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-kraft-dark pt-3">
              <span className="font-mono text-sm text-graphite">Tổng cộng</span>
              <span className="font-mono text-lg font-semibold text-forest">{formatPrice(total)}</span>
            </div>
          </div>

          {order.depositAmount > 0 && (
            <div className="die-cut mt-4 flex flex-wrap items-center justify-between gap-3 bg-paper p-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-graphite">
                  {isFullPayment ? "Đã thanh toán toàn bộ" : "Tiền cọc"}
                </p>
                <p className="font-mono text-lg font-semibold text-ink">
                  {formatPrice(order.depositAmount)}
                </p>
                <p className={`font-mono text-xs ${order.depositPaid ? "text-forest" : "text-stamp"}`}>
                  {order.depositPaid
                    ? (isFullPayment ? "Đã thanh toán" : "Đã nhận cọc")
                    : (isFullPayment ? "Chưa thanh toán" : "Chưa nhận cọc")}
                </p>
              </div>
              <form action={setOrderDepositPaidAction.bind(null, order.id, !order.depositPaid)}>
                <button
                  type="submit"
                  className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
                >
                  {order.depositPaid
                    ? (isFullPayment ? "Bỏ đánh dấu đã thanh toán" : "Bỏ đánh dấu đã cọc")
                    : (isFullPayment ? "Đánh dấu đã thanh toán" : "Đánh dấu đã nhận cọc")}
                </button>
              </form>
            </div>
          )}

          {order.payments.length > 0 && (
            <div className="die-cut mt-4 flex flex-col gap-2 bg-paper p-4">
              <p className="font-mono text-xs uppercase tracking-wide text-graphite">Lịch sử thanh toán</p>
              {order.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-kraft-dark pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-mono text-xs text-ink">
                      {PAYMENT_PROVIDER_LABEL[payment.provider] ?? payment.provider} ·{" "}
                      {formatPaymentAmount(payment.amount, payment.currency)}
                    </p>
                    <p className="font-mono text-[10px] text-graphite">
                      {payment.createdAt.toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${
                      PAYMENT_STATUS_STYLE[payment.status]
                    }`}
                  >
                    {PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="die-cut mt-4 flex flex-col gap-1 bg-paper p-4 font-mono text-xs text-graphite">
            <p>Người nhận: <span className="text-ink">{order.customerName}</span></p>
            <p>Điện thoại: <span className="text-ink">{order.customerPhone}</span></p>
            <p>Địa chỉ: <span className="text-ink">{fullAddress}</span></p>
            <p>Hình thức thanh toán: <span className="text-ink">{paymentMethodLabel}</span></p>
            {order.note && <p>Ghi chú: <span className="text-ink">{order.note}</span></p>}
            {attributionLabel(order) && (
              <p>Nguồn đơn hàng: <span className="text-forest">{attributionLabel(order)}</span></p>
            )}
          </div>
        </div>

        <div className="die-cut h-fit bg-paper p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-graphite">Trạng thái</p>
          <form action={updateOrderStatusAction.bind(null, order.id)} className="mt-2 flex flex-col gap-3">
            <select
              name="status"
              defaultValue={order.status}
              className="die-cut-flat bg-paper px-3 py-2 text-sm text-ink"
            >
              {Object.values(OrderStatus).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
            >
              Cập nhật
            </button>
          </form>

          <div className="mt-4 border-t border-kraft-dark pt-4">
            <p className="font-mono text-xs uppercase tracking-wide text-graphite">
              Vận chuyển (Viettel Post)
            </p>

            {order.trackingCode ? (
              <div className="mt-2 flex flex-col gap-1 font-mono text-xs text-graphite">
                <p>Mã vận đơn: <span className="text-ink">{order.trackingCode}</span></p>
                <p>Trạng thái: <span className="text-ink">{order.shippingStatus ?? "—"}</span></p>
                {order.shippingSyncedAt && (
                  <p>Đồng bộ lúc: {order.shippingSyncedAt.toLocaleString("vi-VN")}</p>
                )}
                <form action={syncShippingStatusAction.bind(null, order.id)} className="mt-2">
                  <button
                    type="submit"
                    className="die-cut-flat w-full cursor-pointer bg-paper px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-kraft-dark/30"
                  >
                    Đồng bộ trạng thái
                  </button>
                </form>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                <CopyShipmentInfoButton text={shipmentInfoText} />
                <p className="font-mono text-[10px] leading-relaxed text-graphite">
                  Dán thông tin trên vào web/app Viettel Post để tạo đơn thủ công, rồi nhập mã vận
                  đơn nhận được vào ô bên dưới.
                </p>
                <form
                  action={setTrackingCodeAction.bind(null, order.id)}
                  className="flex flex-col gap-2"
                >
                  <input
                    name="trackingCode"
                    placeholder="Mã vận đơn Viettel Post"
                    required
                    className="die-cut-flat bg-paper px-3 py-2 text-sm text-ink"
                  />
                  <button
                    type="submit"
                    className="cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
                  >
                    Lưu mã vận đơn
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
