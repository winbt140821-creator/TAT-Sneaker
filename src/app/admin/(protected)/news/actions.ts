"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { readDepartment } from "@/lib/admin-store";

export type NewsFormState = { error?: string };

function readNewsForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const publishedAtRaw = String(formData.get("publishedAt") ?? "").trim();
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
  const newImage = String(formData.get("image") ?? "").trim();
  const keepImage = String(formData.get("keepImage") ?? "");
  const department = readDepartment(formData.get("department")) ?? "SHOES";

  return { title, excerpt, publishedAt, newImage, keepImage, department };
}

export async function createNewsAction(
  _prevState: NewsFormState,
  formData: FormData
): Promise<NewsFormState> {
  await requireStaff();
  const data = readNewsForm(formData);

  if (!data.title || !data.excerpt) {
    return { error: "Vui lòng nhập tiêu đề và tóm tắt." };
  }

  const count = await prisma.newsArticle.count({ where: { department: data.department } });

  await prisma.newsArticle.create({
    data: {
      title: data.title,
      excerpt: data.excerpt,
      publishedAt: data.publishedAt,
      imageUrl: data.newImage || null,
      sortOrder: count,
      department: data.department,
    },
  });

  revalidatePath("/admin/news");
  revalidatePath("/");
  redirect(`/admin/news?department=${data.department}`);
}

export async function updateNewsAction(
  id: string,
  _prevState: NewsFormState,
  formData: FormData
): Promise<NewsFormState> {
  await requireStaff();
  const data = readNewsForm(formData);

  if (!data.title || !data.excerpt) {
    return { error: "Vui lòng nhập tiêu đề và tóm tắt." };
  }

  const imageUrl = data.newImage || data.keepImage || null;

  await prisma.newsArticle.update({
    where: { id },
    data: {
      title: data.title,
      excerpt: data.excerpt,
      publishedAt: data.publishedAt,
      imageUrl,
      department: data.department,
    },
  });

  revalidatePath("/admin/news");
  revalidatePath("/");
  redirect(`/admin/news?department=${data.department}`);
}

export async function deleteNewsAction(id: string) {
  await requireStaff();
  await prisma.newsArticle.delete({ where: { id } });
  revalidatePath("/admin/news");
  revalidatePath("/");
}
