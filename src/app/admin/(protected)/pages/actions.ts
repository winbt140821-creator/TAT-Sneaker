"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

export type StaticPageFormState = { error?: string };

export async function createStaticPageAction(
  _prevState: StaticPageFormState,
  formData: FormData
): Promise<StaticPageFormState> {
  await requireStaff();

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !slug || !content) {
    return { error: "Vui lòng nhập đầy đủ đường dẫn, tiêu đề và nội dung." };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Đường dẫn chỉ được chứa chữ thường, số và dấu gạch ngang." };
  }

  const existing = await prisma.staticPage.findUnique({ where: { slug } });
  if (existing) {
    return { error: "Đường dẫn này đã có trang khác dùng, hãy chọn đường dẫn khác." };
  }

  await prisma.staticPage.create({ data: { title, slug, content } });

  revalidatePath("/admin/pages");
  redirect("/admin/pages");
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
  // "vi" is unprefixed (default locale, localePrefix: "as-needed" — see
  // src/i18n/routing.ts), en/zh need their own prefixed path revalidated too
  // now that this route is static-cacheable (generateStaticParams in
  // src/app/[locale]/trang/[slug]/page.tsx).
  revalidatePath(`/trang/${page.slug}`);
  revalidatePath(`/en/trang/${page.slug}`);
  revalidatePath(`/zh/trang/${page.slug}`);
  redirect("/admin/pages");
}
