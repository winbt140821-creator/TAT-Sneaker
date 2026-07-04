"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { OrderStatus } from "@/generated/prisma/client";
import { createShipment, getShipmentStatus } from "@/lib/shipping/viettelpost";
import { restoreOrderStock } from "@/lib/order-cleanup";

export async function updateOrderStatusAction(id: string, formData: FormData) {
  await requireStaff();
  const status = String(formData.get("status") ?? "");

  if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
    throw new Error("Trạng thái không hợp lệ.");
  }

  const current = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!current) throw new Error("Không tìm thấy đơn hàng.");

  // Checkout reserves stock the moment an order is placed — cancelling one
  // must give that stock back, or repeatedly placing/cancelling orders would
  // permanently drain a size's inventory without ever selling it. Only fires
  // on the transition into CANCELLED, not if it's already there.
  if (status === OrderStatus.CANCELLED && current.status !== OrderStatus.CANCELLED) {
    await prisma.$transaction(async (tx) => {
      await restoreOrderStock(tx, id);
      await tx.order.update({ where: { id }, data: { status: status as OrderStatus } });
    });
  } else {
    await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function deleteOrderAction(id: string) {
  await requireStaff();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error("Không tìm thấy đơn hàng.");
  if (order.status !== OrderStatus.CANCELLED) {
    throw new Error("Chỉ có thể xóa đơn hàng đã hủy.");
  }

  await prisma.order.delete({ where: { id } });

  revalidatePath("/admin/orders");
}

export async function setOrderDepositPaidAction(id: string, depositPaid: boolean) {
  await requireStaff();

  await prisma.order.update({
    where: { id },
    data: { depositPaid },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function createShipmentAction(id: string) {
  await requireStaff();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Error("Không tìm thấy đơn hàng.");

  const result = await createShipment(order);

  await prisma.order.update({
    where: { id },
    data: {
      trackingCode: result.trackingCode,
      shippingStatus: result.status,
      shippingSyncedAt: new Date(),
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function setTrackingCodeAction(id: string, formData: FormData) {
  await requireStaff();

  const trackingCode = String(formData.get("trackingCode") ?? "").trim();
  if (!trackingCode) throw new Error("Vui lòng nhập mã vận đơn.");

  await prisma.order.update({
    where: { id },
    data: {
      trackingCode,
      shippingStatus: "Đã tạo vận đơn (thủ công)",
      shippingSyncedAt: new Date(),
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function syncShippingStatusAction(id: string) {
  await requireStaff();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error("Không tìm thấy đơn hàng.");
  if (!order.trackingCode) throw new Error("Đơn hàng chưa có mã vận đơn.");

  const result = await getShipmentStatus(order.trackingCode);

  await prisma.order.update({
    where: { id },
    data: { shippingStatus: result.status, shippingSyncedAt: new Date() },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}
