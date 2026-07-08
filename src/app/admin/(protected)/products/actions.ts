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
    // New products default to the end of the manual display order (not 0)
    // so they don't jump ahead of everything the admin has already arranged.
    const { _max } = await prisma.product.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (_max.sortOrder ?? -1) + 1;

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
        sortOrder,
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

/** Hides/shows a product on the customer-facing site without deleting it —
 *  it stays fully editable in admin either way (see hidden checks in
 *  src/lib/catalog.ts). */
export async function toggleProductHiddenAction(id: string) {
  await requireStaff();
  // One raw UPDATE instead of a read-then-write — SQLite stores Boolean as
  // 0/1, so NOT negates it directly, cutting a round trip against the
  // remote (Turso) database out of every single toggle click.
  await prisma.$executeRaw`UPDATE "Product" SET "hidden" = NOT "hidden" WHERE "id" = ${id}`;
  revalidatePath("/admin/products");
  revalidatePath("/");
}

/** Moves a product up/down in the customer-facing display order (the
 *  "popularity"/default sort in src/lib/catalog.ts). Swaps sortOrder with
 *  the single adjacent sibling, queried across the whole table rather than
 *  just the current page — the products list is paginated and can hold
 *  hundreds of rows, so renormalizing every row's sortOrder per move (like
 *  moveCategoryAction does for the small, unpaginated category list) would
 *  mean O(n) writes per click. This is O(1), and still lets an item cross a
 *  pagination boundary since the adjacency lookup isn't scoped to one page.
 *
 *  When called from the admin's "Theo danh mục" (by-folder) view, categoryId
 *  scopes the sibling lookup to products tagged with that same category, so
 *  "up"/"down" there reorders within the folder instead of jumping to
 *  whatever product is globally next in sortOrder (which could belong to an
 *  unrelated category interleaved in the same numeric range). */
export async function moveProductAction(id: string, direction: "up" | "down", categoryId?: string) {
  await requireStaff();

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, sortOrder: true },
  });
  if (!product) return;

  const sibling = await prisma.product.findFirst({
    where: {
      ...(direction === "up"
        ? { sortOrder: { lt: product.sortOrder } }
        : { sortOrder: { gt: product.sortOrder } }),
      ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
    },
    orderBy:
      direction === "up"
        ? [{ sortOrder: "desc" }, { id: "desc" }]
        : [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, sortOrder: true },
  });
  if (!sibling) return;

  await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { sortOrder: sibling.sortOrder } }),
    prisma.product.update({ where: { id: sibling.id }, data: { sortOrder: product.sortOrder } }),
  ]);

  revalidatePath("/admin/products");
  revalidatePath("/");
}
