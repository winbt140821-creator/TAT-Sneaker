"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

export type StaticPageFormState = { error?: string };

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
  revalidatePath(`/trang/${page.slug}`);
  redirect("/admin/pages");
}
