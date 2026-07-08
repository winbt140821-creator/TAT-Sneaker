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

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sizeQuantities: true },
  });
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

/** Sets a size's quantity to an exact value typed in by the admin — faster
 *  than clicking +/- repeatedly for a bulk restock. `size` comes from the
 *  form itself (a hidden field for an already-shown size, or a <select> for
 *  picking which hidden PREORDER size just got real stock) rather than a
 *  bound argument, since the same action serves both. Sizes the product
 *  doesn't carry at all are never touched here — carrying a size at all is
 *  an edit-form change. */
export async function setSizeQuantityAction(productId: string, formData: FormData) {
  await requireStaff();

  const size = Number(formData.get("size"));
  const raw = Math.floor(Number(formData.get("quantity") ?? 0));
  const quantity = Number.isFinite(raw) ? Math.max(0, raw) : 0;
  if (!Number.isFinite(size)) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sizeQuantities: true },
  });
  if (!product) throw new Error("Không tìm thấy sản phẩm.");

  const sizeQuantities: Record<string, number> = JSON.parse(product.sizeQuantities);
  const key = String(size);
  if (!(key in sizeQuantities)) return;

  sizeQuantities[key] = quantity;

  await prisma.product.update({
    where: { id: productId },
    data: { sizeQuantities: JSON.stringify(sizeQuantities) },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");
}
