"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export type CategoryFormState = { error?: string };

async function readCategoryForm(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  const hot = formData.get("hot") === "on";
  const sale = formData.get("sale") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  const showcaseEnabled = formData.get("showcaseEnabled") === "on";
  const keepShowcaseImage = String(formData.get("keepShowcaseImage") ?? "").trim() || null;
  const newShowcaseImage = String(formData.get("showcaseImage") ?? "").trim() || null;
  const showcaseImageUrl = newShowcaseImage ?? keepShowcaseImage;
  return {
    label,
    slug: slugInput ? slugify(slugInput) : slugify(label),
    parentId,
    hot,
    sale,
    sortOrder,
    showcaseEnabled,
    showcaseImageUrl,
  };
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireStaff();
  const data = await readCategoryForm(formData);

  if (!data.label || !data.slug) {
    return { error: "Vui lòng nhập tên danh mục." };
  }

  try {
    await prisma.category.create({ data });
  } catch {
    return { error: `Slug "${data.slug}" đã tồn tại, hãy chọn tên khác.` };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function updateCategoryAction(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireStaff();
  const data = await readCategoryForm(formData);

  if (!data.label || !data.slug) {
    return { error: "Vui lòng nhập tên danh mục." };
  }
  if (data.parentId === id) {
    return { error: "Danh mục không thể là danh mục cha của chính nó." };
  }

  try {
    await prisma.category.update({ where: { id }, data });
  } catch {
    return { error: `Slug "${data.slug}" đã tồn tại, hãy chọn tên khác.` };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(id: string) {
  await requireStaff();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
