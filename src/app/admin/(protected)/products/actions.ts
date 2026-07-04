"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { saveUploadedImages } from "@/lib/uploads";
import { ProductAvailability } from "@/generated/prisma/client";

export type ProductFormState = { error?: string };

function generateSku() {
  return `SP${Date.now().toString(36).toUpperCase()}`;
}

function readProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim() || generateSku();
  const price = Math.round(Number(formData.get("price") ?? 0));
  const costPriceRaw = String(formData.get("costPrice") ?? "").trim();
  const costPrice = costPriceRaw ? Math.round(Number(costPriceRaw)) : null;
  const quality = String(formData.get("quality") ?? "Auth");
  const accent = String(formData.get("accent") ?? "#4a4638");
  const carriedSizes = formData.getAll("carriedSizes").map(Number).filter((n) => !Number.isNaN(n));
  const sizeQuantities: Record<string, number> = {};
  for (const s of carriedSizes) {
    const raw = Math.floor(Number(formData.get(`qty_${s}`) ?? 0));
    sizeQuantities[String(s)] = Number.isFinite(raw) && raw > 0 ? raw : 0;
  }
  const categoryIds = formData.getAll("categoryIds").map(String);
  const keepImages = formData.getAll("keepImages").map(String);
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;

  const availabilityRaw = String(formData.get("availability") ?? "IN_STOCK");
  const availability =
    availabilityRaw === "PREORDER" ? ProductAvailability.PREORDER : ProductAvailability.IN_STOCK;
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
    quality,
    accent,
    sizeQuantities,
    categoryIds,
    keepImages,
    files,
    videoUrl,
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

  const uploaded = await saveUploadedImages(data.files);

  try {
    await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        price: data.price,
        costPrice: data.costPrice,
        quality: data.quality,
        accent: data.accent,
        sizeQuantities: JSON.stringify(data.sizeQuantities),
        images: JSON.stringify(uploaded),
        videoUrl: data.videoUrl,
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

  const uploaded = await saveUploadedImages(data.files);
  const images = [...data.keepImages, ...uploaded];

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        price: data.price,
        costPrice: data.costPrice,
        quality: data.quality,
        accent: data.accent,
        sizeQuantities: JSON.stringify(data.sizeQuantities),
        images: JSON.stringify(images),
        videoUrl: data.videoUrl,
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
