"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

/** Adjusts a single size's quantity by delta (+1/-1 from the inventory
 *  page's stepper buttons). Sizes the product doesn't carry at all are
 *  never touched here — that's an edit-form change. Quantity never drops
 *  below 0. */
export async function adjustSizeQuantityAction(productId: string, size: number, delta: number) {
  await requireStaff();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Không tìm thấy sản phẩm.");

  const sizeQuantities: Record<string, number> = JSON.parse(product.sizeQuantities);
  const key = String(size);
  if (!(key in sizeQuantities)) return;

  sizeQuantities[key] = Math.max(0, (sizeQuantities[key] ?? 0) + delta);

  await prisma.product.update({
    where: { id: productId },
    data: { sizeQuantities: JSON.stringify(sizeQuantities) },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateShippingFeeAction(productId: string, formData: FormData) {
  await requireStaff();

  const shippingFee = Math.max(0, Math.round(Number(formData.get("shippingFee") ?? 0)));
  await prisma.product.update({ where: { id: productId }, data: { shippingFee } });

  revalidatePath("/admin/inventory");
}

/** Applies the same shipping fee to every product at once — for when admin
 *  wants one flat rate site-wide instead of setting each item individually. */
export async function bulkUpdateShippingFeeAction(formData: FormData) {
  await requireStaff();

  const shippingFee = Math.max(0, Math.round(Number(formData.get("bulkShippingFee") ?? 0)));
  await prisma.product.updateMany({ data: { shippingFee } });

  revalidatePath("/admin/inventory");
}
