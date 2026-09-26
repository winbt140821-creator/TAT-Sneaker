"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { readDepartment } from "@/lib/admin-store";
import { storeHref } from "@/lib/store-path";
import type { Department } from "@/lib/inventory";

export type StaticPageFormState = { error?: string };

// "vi" is unprefixed (default locale, localePrefix: "as-needed" — see
// src/i18n/routing.ts), en/zh have their own prefixed paths.
function revalidatePage(slug: string, department: Department) {
  const path = storeHref(department, `/trang/${slug}`);
  revalidatePath(path);
  revalidatePath(`/en${path}`);
  revalidatePath(`/zh${path}`);
}

export async function createStaticPageAction(
  _prevState: StaticPageFormState,
  formData: FormData
): Promise<StaticPageFormState> {
  await requireStaff();

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const department = readDepartment(formData.get("department")) ?? "SHOES";

  if (!title || !slug || !content) {
    return { error: "Vui lòng nhập đầy đủ đường dẫn, tiêu đề và nội dung." };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Đường dẫn chỉ được chứa chữ thường, số và dấu gạch ngang." };
  }

  const existing = await prisma.staticPage.findUnique({ where: { slug_department: { slug, department } } });
  if (existing) {
    return { error: "Cửa hàng này đã có trang dùng đường dẫn này, hãy sửa trang đó hoặc chọn đường dẫn khác." };
  }

  await prisma.staticPage.create({ data: { title, slug, content, department } });

  revalidatePath("/admin/pages");
  revalidatePage(slug, department);
  redirect(`/admin/pages?department=${department}`);
}

export async function updateStaticPageAction(
  id: string,
  _prevState: StaticPageFormState,
  formData: FormData
): Promise<StaticPageFormState> {
  await requireStaff();

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !content) {
    return { error: "Vui lòng nhập tiêu đề và nội dung." };
  }

  const page = await prisma.staticPage.update({
    where: { id },
    data: { title, content },
  });

  revalidatePath("/admin/pages");
  revalidatePage(page.slug, page.department);
  // The clothing store shows the shoe store's copy of a page it has none of.
  if (page.department === "SHOES") revalidatePage(page.slug, "CLOTHING");
  redirect(`/admin/pages?department=${page.department}`);
}
