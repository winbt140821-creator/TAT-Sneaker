"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ProductAvailability } from "@/generated/prisma/client";
import { ALL_SIZES, PREORDER_DEFAULT_QTY } from "@/lib/inventory";

export type ProductFormState = { error?: string };

function generateSku() {
  return `SP${Date.now().toString(36).toUpperCase()}`;
}

function readProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim() || generateSku();
  const price = Math.round(Number(formData.get("price") ?? 0));
  const baseCostPriceRaw = String(formData.get("baseCostPrice") ?? "").trim();
  const shippingFee = Math.max(0, Math.round(Number(formData.get("shippingFee") ?? 0)));
  // Giá nhập (nội bộ, dùng để tính lợi nhuận) = giá gốc + phí ship.
  const costPrice = baseCostPriceRaw ? Math.round(Number(baseCostPriceRaw)) + shippingFee : null;
  const quality = String(formData.get("quality") ?? "Auth");
  const carriedSizes = formData.getAll("carriedSizes").map(Number).filter((n) => !Number.isNaN(n));

  const availabilityRaw = String(formData.get("availability") ?? "IN_STOCK");
  const availability =
    availabilityRaw === "PREORDER" ? ProductAvailability.PREORDER : ProductAvailability.IN_STOCK;

  const sizeQuantities: Record<string, number> = {};
  if (availability === ProductAvailability.PREORDER) {
    // Preorder items don't need real stock to be orderable — every standard
    // size is sellable by default (see PREORDER_DEFAULT_QTY), and admin only
    // has to edit the sizes where a pair is actually on hand already.
    for (const s of ALL_SIZES) {
      const carried = carriedSizes.includes(s);
      const raw = Math.floor(Number(formData.get(`qty_${s}`) ?? PREORDER_DEFAULT_QTY));
      sizeQuantities[String(s)] = carried && Number.isFinite(raw) && raw >= 0 ? raw : PREORDER_DEFAULT_QTY;
    }
    // Custom (non-standard) sizes still opt in via the checkbox like before.
    for (const s of carriedSizes.filter((s) => !ALL_SIZES.includes(s))) {
      const raw = Math.floor(Number(formData.get(`qty_${s}`) ?? PREORDER_DEFAULT_QTY));
      sizeQuantities[String(s)] = Number.isFinite(raw) && raw >= 0 ? raw : PREORDER_DEFAULT_QTY;
    }
  } else {
    for (const s of carriedSizes) {
      const raw = Math.floor(Number(formData.get(`qty_${s}`) ?? 0));
      sizeQuantities[String(s)] = Number.isFinite(raw) && raw > 0 ? raw : 0;
    }
  }
  const categoryIds = formData.getAll("categoryIds").map(String);
  const images = formData.getAll("images").map(String);
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const leadTimeMinDays = Math.max(0, Math.round(Number(formData.get("leadTimeMinDays") ?? 0)));
  const leadTimeMaxDays = Math.max(
    leadTimeMinDays,
    Math.round(Number(formData.get("leadTimeMaxDays") ?? 0))
  );
  const depositRequired = formData.get("depositRequired") === "on";
  const depositAmountRaw = String(formData.get("depositAmount") ?? "").trim();
  const depositAmount = depositRequired && depositAmountRaw ? Math.round(Number(depositAmountRaw)) : null;

  return {
    name,
    sku,
    price,
    costPrice,
    shippingFee,
    quality,
    sizeQuantities,
    categoryIds,
    images,
    videoUrl,
    description,
    availability,
    leadTimeMinDays,
    leadTimeMaxDays,
    depositRequired,
    depositAmount,
  };
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireStaff();
  const data = readProductForm(formData);

  if (!data.name) {
    return { error: "Vui lòng nhập tên sản phẩm." };
  }
  if (data.depositRequired && !data.depositAmount) {
    return { error: "Vui lòng nhập số tiền cọc." };
  }

  try {
    await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        price: data.price,
        costPrice: data.costPrice,
        shippingFee: data.shippingFee,
        quality: data.quality,
        sizeQuantities: JSON.stringify(data.sizeQuantities),
        images: JSON.stringify(data.images),
        videoUrl: data.videoUrl,
        description: data.description,
        availability: data.availability,
        leadTimeMinDays: data.leadTimeMinDays,
        leadTimeMaxDays: data.leadTimeMaxDays,
        depositRequired: data.depositRequired,
        depositAmount: data.depositAmount,
        categories: { connect: data.categoryIds.map((id) => ({ id })) },
      },
    });
  } catch {
    return { error: `Mã SKU "${data.sku}" đã tồn tại.` };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProductAction(
  id: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireStaff();
  const data = readProductForm(formData);

  if (!data.name) {
    return { error: "Vui lòng nhập tên sản phẩm." };
  }
  if (data.depositRequired && !data.depositAmount) {
    return { error: "Vui lòng nhập số tiền cọc." };
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        price: data.price,
        costPrice: data.costPrice,
        shippingFee: data.shippingFee,
        quality: data.quality,
        sizeQuantities: JSON.stringify(data.sizeQuantities),
        images: JSON.stringify(data.images),
        videoUrl: data.videoUrl,
        description: data.description,
        availability: data.availability,
        leadTimeMinDays: data.leadTimeMinDays,
        leadTimeMaxDays: data.leadTimeMaxDays,
        depositRequired: data.depositRequired,
        depositAmount: data.depositAmount,
        categories: { set: data.categoryIds.map((id) => ({ id })) },
      },
    });
  } catch {
    return { error: `Mã SKU "${data.sku}" đã tồn tại.` };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProductAction(id: string) {
  await requireStaff();
  try {
    await prisma.product.delete({ where: { id } });
  } catch {
    throw new Error(
      "Không thể xóa sản phẩm này vì đã có trong đơn hàng. Hãy chỉnh sửa thay vì xóa."
    );
  }
  revalidatePath("/admin/products");
  revalidatePath("/");
}
