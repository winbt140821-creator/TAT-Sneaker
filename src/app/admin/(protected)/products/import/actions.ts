"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { isOwnUploadUrl } from "@/lib/uploads";
import { albumUrl, checkShop, parseAlbumLinks, parseShopLink, parseShopOwner, YupooError } from "@/lib/yupoo";
import { SIZE_SETS, PREORDER_DEFAULT_QTY, IN_STOCK_LEAD_TIME, type Department } from "@/lib/inventory";
import { ProductAvailability } from "@/generated/prisma/client";

// Same defaults the product form gives a preorder item (see ProductForm).
const PREORDER_LEAD_TIME = { min: 10, max: 15 };
const QUALITY_TIERS = ["Auth", "Best Quality", "Like Auth", "Rep 11"];

export type SourceFormState = { error?: string; savedId?: string };

/** Adds a Yupoo shop, or updates the password/store of one already saved.
 *  The password is checked against Yupoo before it's kept. */
export async function saveImportSourceAction(_prev: SourceFormState, formData: FormData): Promise<SourceFormState> {
  await requireStaff();
  const owner = parseShopOwner(String(formData.get("url") ?? ""));
  if (!owner) return { error: "Dán link shop Yupoo, dạng https://tenshop.x.yupoo.com" };
  const password = String(formData.get("password") ?? "").trim() || null;
  const department: Department = formData.get("department") === "SHOES" ? "SHOES" : "CLOTHING";

  let nickname: string;
  let locked: boolean;
  try {
    ({ nickname, locked } = await checkShop(owner, password));
  } catch (err) {
    return { error: err instanceof YupooError ? err.message : "Không kiểm tra được shop này." };
  }

  const source = await prisma.importSource.upsert({
    where: { owner },
    create: { owner, label: nickname, password: locked ? password : null, department },
    update: { label: nickname, password: locked ? password : null, department },
    select: { id: true },
  });
  revalidatePath("/admin/products/import");
  return { savedId: source.id };
}

export async function deleteImportSourceAction(id: string) {
  await requireStaff();
  await prisma.importSource.deleteMany({ where: { id } });
  revalidatePath("/admin/products/import");
}

export type ResolvedLinks = {
  error?: string;
  // This shop is locked and not saved yet (or the password given is wrong):
  // ask for its password, then call again.
  needPassword?: string;
  // Album links: import these.
  items?: { sourceId: string; albumId: string; productId: string | null }[];
  // A shop, category or search link: show its albums to pick from.
  shop?: { sourceId: string; categoryId?: string; q?: string };
};

/** The saved shop for `owner` — a shop seen for the first time is checked
 *  and saved, keeping the password only if it's locked. */
async function ensureSource(
  owner: string,
  password: string | null,
  department: Department
): Promise<{ id: string } | { needPassword: string; error?: string } | { error: string }> {
  const saved = await prisma.importSource.findUnique({ where: { owner }, select: { id: true } });
  if (saved) return saved;
  try {
    const { nickname, locked } = await checkShop(owner, password);
    return await prisma.importSource.create({
      data: {
        owner,
        label: nickname,
        password: locked ? password : null,
        department: department === "SHOES" ? "SHOES" : "CLOTHING",
      },
      select: { id: true },
    });
  } catch (err) {
    if (err instanceof YupooError && err.kind === "locked") {
      return { needPassword: owner, ...(password ? { error: err.message } : {}) };
    }
    return { error: err instanceof YupooError ? err.message : "Không kiểm tra được shop này." };
  }
}

/** Pasted Yupoo links → what to do with them. Album links (one or many)
 *  come back as albums to import, with whether each is already a product
 *  here; a shop, category or search link comes back as the shop to browse. */
export async function resolveAlbumLinksAction(
  text: string,
  password: string | null,
  department: Department
): Promise<ResolvedLinks> {
  await requireStaff();
  const pass = password?.trim() || null;
  const links = parseAlbumLinks(text);
  const shopLink = links.length === 0 ? parseShopLink(text) : null;
  if (links.length === 0 && !shopLink) {
    return {
      error:
        "Không thấy link Yupoo nào. Dán link album (…x.yupoo.com/albums/123456) hoặc link shop (https://tenshop.x.yupoo.com).",
    };
  }
  if (links.length > 50) return { error: "Tối đa 50 link mỗi lần." };

  const sourceIds = new Map<string, string>();
  for (const owner of shopLink ? [shopLink.owner] : new Set(links.map((l) => l.owner))) {
    const source = await ensureSource(owner, pass, department);
    if (!("id" in source)) return source;
    sourceIds.set(owner, source.id);
  }
  revalidatePath("/admin/products/import");

  if (shopLink) {
    return { shop: { sourceId: sourceIds.get(shopLink.owner)!, categoryId: shopLink.categoryId, q: shopLink.q } };
  }
  const urls = links.map((l) => albumUrl(l.owner, l.albumId));
  const existing = await prisma.product.findMany({ where: { sourceUrl: { in: urls } }, select: { id: true, sourceUrl: true } });
  const productByUrl = new Map(existing.map((p) => [p.sourceUrl, p.id]));
  return {
    items: links.map((l) => ({
      sourceId: sourceIds.get(l.owner)!,
      albumId: l.albumId,
      productId: productByUrl.get(albumUrl(l.owner, l.albumId)) ?? null,
    })),
  };
}

export type ImportedProductInput = {
  sourceId: string;
  albumId: string;
  department: Department;
  name: string;
  description: string | null;
  images: string[];
  sizes: string[];
  categoryIds: string[];
  price: number;
  quality: string;
  availability: "PREORDER" | "IN_STOCK";
  publish: boolean;
  // Import again even though a product from this album exists.
  again: boolean;
};

export type ImportedProductResult = { id?: string; skipped?: boolean; hidden?: boolean; error?: string };

/** Creates one product from an album whose photos are already copied into
 *  our storage. Starts hidden unless staff asked to publish and gave a
 *  price — a product without a price must never reach shoppers. */
export async function createImportedProductAction(input: ImportedProductInput): Promise<ImportedProductResult> {
  await requireStaff();

  const source = await prisma.importSource.findUnique({ where: { id: input.sourceId }, select: { owner: true } });
  if (!source || !/^\d+$/.test(input.albumId)) return { error: "Không tìm thấy shop hoặc album." };
  const sourceUrl = albumUrl(source.owner, input.albumId);

  if (!input.again) {
    const existing = await prisma.product.findFirst({ where: { sourceUrl }, select: { id: true } });
    if (existing) return { id: existing.id, skipped: true };
  }

  const department: Department = input.department === "SHOES" ? "SHOES" : "CLOTHING";
  const name = input.name.trim().slice(0, 200);
  if (!name) return { error: "Thiếu tên sản phẩm." };
  const images = input.images.filter(isOwnUploadUrl).slice(0, 40);
  const price = Math.max(0, Math.round(Number(input.price) || 0));
  const preorder = input.availability !== "IN_STOCK";
  const quality = QUALITY_TIERS.includes(input.quality) ? input.quality : "Auth";

  // Preorder items carry every standard size (as the product form does)
  // plus any extra the album lists (3XL…); stock items carry what the album
  // lists at 0 until staff count what's actually on hand.
  const listed = input.sizes.map((s) => String(s).trim().slice(0, 12)).filter(Boolean).slice(0, 30);
  const sizes = preorder
    ? [...new Set([...SIZE_SETS[department], ...listed])]
    : listed.length > 0
      ? listed
      : SIZE_SETS[department];
  const sizeQuantities = Object.fromEntries(sizes.map((s) => [s, preorder ? PREORDER_DEFAULT_QTY : 0]));

  const categories = await prisma.category.findMany({
    where: { id: { in: input.categoryIds.slice(0, 20) }, department },
    select: { id: true },
  });

  const { _max } = await prisma.product.aggregate({ _max: { sortOrder: true } });
  const hidden = !(input.publish && price > 0);
  for (let attempt = 0; attempt < 3; attempt++) {
    const sku = `SP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
    try {
      const product = await prisma.product.create({
        data: {
          name,
          sku,
          price,
          quality,
          department,
          sizeQuantities: JSON.stringify(sizeQuantities),
          images: JSON.stringify(images),
          description: input.description?.trim().slice(0, 5000) || null,
          availability: preorder ? ProductAvailability.PREORDER : ProductAvailability.IN_STOCK,
          leadTimeMinDays: preorder ? PREORDER_LEAD_TIME.min : IN_STOCK_LEAD_TIME.min,
          leadTimeMaxDays: preorder ? PREORDER_LEAD_TIME.max : IN_STOCK_LEAD_TIME.max,
          hidden,
          sortOrder: (_max.sortOrder ?? -1) + 1,
          sourceUrl,
          categories: { connect: categories },
        },
        select: { id: true },
      });
      revalidatePath("/admin/products");
      if (!hidden) revalidatePath("/");
      return { id: product.id, hidden };
    } catch (err) {
      if (!String(err).includes("Unique constraint")) return { error: "Không lưu được sản phẩm." };
    }
  }
  return { error: "Không tạo được mã SKU, thử lại." };
}
