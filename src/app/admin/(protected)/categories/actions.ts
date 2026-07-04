"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export type CategoryFormState = { error?: string };

function readCategoryForm(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  const hot = formData.get("hot") === "on";
  const sale = formData.get("sale") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  return {
    label,
    slug: slugInput ? slugify(slugInput) : slugify(label),
    parentId,
    hot,
    sale,
    sortOrder,
  };
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireStaff();
  const data = readCategoryForm(formData);

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
  const data = readCategoryForm(formData);

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
