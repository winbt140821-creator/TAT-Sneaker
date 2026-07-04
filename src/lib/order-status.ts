import type { OrderStatus } from "@/generated/prisma/client";

// Shared across every admin page that lists/shows an order's status, so a
// label or color change only needs to happen in one place.
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPED: "Đang giao",
  DONE: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-graphite text-paper",
  CONFIRMED: "bg-ink text-paper",
  SHIPPED: "bg-forest text-paper",
  DONE: "bg-forest text-paper",
  CANCELLED: "bg-stamp text-paper",
};
