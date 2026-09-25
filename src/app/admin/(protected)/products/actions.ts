"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getSocialLinkedProducts } from "@/lib/social-links";
import { SIZE_SETS, PREORDER_DEFAULT_QTY, type Department } from "@/lib/inventory";
import { Prisma, ProductAvailability } from "@/generated/prisma/client";
import { formatPrice } from "@/lib/products";
import { getAdminStore } from "@/lib/admin-store";
import { productListWhere, readProductListFilter } from "@/lib/admin-product-filter";

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
  const departmentRaw = String(formData.get("department") ?? "SHOES");
  const department: Department = departmentRaw === "CLOTHING" ? "CLOTHING" : "SHOES";
  const knownSizes = SIZE_SETS[department];
  const carriedSizes = formData
    .getAll("carriedSizes")
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);

  const availabilityRaw = String(formData.get("availability") ?? "IN_STOCK");
  const availability =
    availabilityRaw === "PREORDER" ? ProductAvailability.PREORDER : ProductAvailability.IN_STOCK;

  const sizeQuantities: Record<string, number> = {};
  if (availability === ProductAvailability.PREORDER) {
    // Preorder items don't need real stock to be orderable — every standard
    // size is sellable by default (see PREORDER_DEFAULT_QTY), and admin only
    // has to edit the sizes where a pair is actually on hand already.
    for (const s of knownSizes) {
      const carried = carriedSizes.includes(s);
      const raw = Math.floor(Number(formData.get(`qty_${s}`) ?? PREORDER_DEFAULT_QTY));
      sizeQuantities[s] = carried && Number.isFinite(raw) && raw >= 0 ? raw : PREORDER_DEFAULT_QTY;
    }
    // Custom (non-standard) sizes still opt in via the checkbox like before.
    for (const s of carriedSizes.filter((s) => !knownSizes.includes(s))) {
      const raw = Math.floor(Number(formData.get(`qty_${s}`) ?? PREORDER_DEFAULT_QTY));
      sizeQuantities[s] = Number.isFinite(raw) && raw >= 0 ? raw : PREORDER_DEFAULT_QTY;
    }
  } else {
    for (const s of carriedSizes) {
      const raw = Math.floor(Number(formData.get(`qty_${s}`) ?? 0));
      sizeQuantities[s] = Number.isFinite(raw) && raw > 0 ? raw : 0;
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
    department,
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
        department: data.department,
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
        department: data.department,
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
  // The list offers no delete button for these (see ProductRow) — this only
  // stops a stale page from deleting a product whose link is in a post.
  if ((await getSocialLinkedProducts()).has(id)) return;
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
  // A product with no price yet (fresh from the Yupoo import) stays hidden —
  // the list shows it greyed out with no "Hiện lại" button, this only stops
  // a stale page.
  await prisma.$executeRaw`UPDATE "Product" SET "hidden" = NOT "hidden" WHERE "id" = ${id} AND ("hidden" = 0 OR "price" > 0)`;
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
    select: { id: true, sortOrder: true, department: true },
  });
  if (!product) return;

  // Each store orders its own products: swapping with the other store's
  // neighbour would look like nothing happened.
  const sibling = await prisma.product.findFirst({
    where: {
      department: product.department,
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

export type BulkProductsState = { message?: string; error?: string; at?: number };

const BULK_CHUNK = 200;

function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
}

/** Changes price or visibility of many products at once — the ticked rows,
 *  or every product the list's current filter shows. Price changes:
 *  "set" gives one price; "add" moves by an amount; "percent" by a
 *  percentage, rounded to the nearest 1.000đ. Products with no price yet
 *  are only touched by "set", and are never shown to shoppers. */
export async function bulkProductsAction(_prev: BulkProductsState, formData: FormData): Promise<BulkProductsState> {
  await requireStaff();
  const op = String(formData.get("op") ?? "");
  const at = Date.now();

  let ids: string[];
  if (formData.get("scope") === "filter") {
    const filter = readProductListFilter((k) => formData.get(k)?.toString(), await getAdminStore());
    ids = (await prisma.product.findMany({ where: productListWhere(filter), select: { id: true } })).map((p) => p.id);
  } else {
    ids = [...new Set(formData.getAll("ids").map(String))].slice(0, 1000);
  }
  if (ids.length === 0) return { error: "Chưa chọn sản phẩm nào.", at };

  let changed = 0;
  let message: string;

  if (op === "show" || op === "hide") {
    for (const part of chunks(ids, BULK_CHUNK)) {
      const { count } = await prisma.product.updateMany({
        where: { id: { in: part }, ...(op === "show" ? { price: { gt: 0 } } : {}) },
        data: { hidden: op === "hide" },
      });
      changed += count;
    }
    const noPrice = ids.length - changed;
    message =
      op === "show"
        ? `Đã hiện ${changed} sản phẩm.${noPrice > 0 ? ` ${noPrice} sản phẩm chưa có giá nên vẫn ẩn.` : ""}`
        : `Đã ẩn ${changed} sản phẩm.`;
  } else if (op === "price") {
    const mode = String(formData.get("priceMode") ?? "set");
    const raw = String(formData.get("amount") ?? "").trim();
    const negative = raw.startsWith("-");
    // "350.000" is 350 nghìn đồng, but "7,5" / "7.5" is 7.5%.
    const digits = mode === "percent" ? raw.replace(",", ".").replace(/[^\d.]/g, "") : raw.replace(/\D/g, "");
    const amount = Number(digits) * (negative ? -1 : 1);
    if (!raw || !Number.isFinite(amount) || amount === 0) return { error: "Nhập số tiền hoặc phần trăm.", at };

    if (mode === "set") {
      if (amount < 1000) return { error: "Giá bán phải từ 1.000đ trở lên.", at };
      for (const part of chunks(ids, BULK_CHUNK)) {
        changed += (await prisma.product.updateMany({ where: { id: { in: part } }, data: { price: Math.round(amount) } })).count;
      }
      message = `Đã đặt giá ${formatPrice(Math.round(amount))} cho ${changed} sản phẩm.`;
    } else if (mode === "add") {
      const delta = Math.round(amount);
      for (const part of chunks(ids, BULK_CHUNK)) {
        changed += await prisma.$executeRaw`UPDATE "Product" SET "price" = MAX(1000, "price" + ${delta}) WHERE "price" > 0 AND "id" IN (${Prisma.join(part)})`;
      }
      message = `Đã ${delta > 0 ? "tăng" : "giảm"} ${formatPrice(Math.abs(delta))} cho ${changed} sản phẩm.`;
    } else {
      if (amount <= -90 || amount > 500) return { error: "Phần trăm phải trong khoảng -90% đến 500%.", at };
      const factor = (100 + amount) / 100;
      for (const part of chunks(ids, BULK_CHUNK)) {
        changed += await prisma.$executeRaw`UPDATE "Product" SET "price" = MAX(1000, CAST(ROUND("price" * ${factor} / 1000.0) AS INTEGER) * 1000) WHERE "price" > 0 AND "id" IN (${Prisma.join(part)})`;
      }
      message = `Đã ${amount > 0 ? "tăng" : "giảm"} ${Math.abs(amount)}% (làm tròn tới 1.000đ) cho ${changed} sản phẩm.`;
    }
    const skipped = ids.length - changed;
    if (skipped > 0 && mode !== "set") message += ` Bỏ qua ${skipped} sản phẩm chưa có giá.`;
  } else {
    return { error: "Thao tác không hợp lệ.", at };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { message, at };
}
