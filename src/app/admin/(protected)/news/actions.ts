"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { saveUploadedImages } from "@/lib/uploads";

export type NewsFormState = { error?: string };

function readNewsForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const publishedAtRaw = String(formData.get("publishedAt") ?? "").trim();
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
  const file = formData.get("image");
  const files = file instanceof File && file.size > 0 ? [file] : [];
  const keepImage = String(formData.get("keepImage") ?? "");

  return { title, excerpt, publishedAt, files, keepImage };
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

  const uploaded = await saveUploadedImages(data.files);
  const count = await prisma.newsArticle.count();

  await prisma.newsArticle.create({
    data: {
      title: data.title,
      excerpt: data.excerpt,
      publishedAt: data.publishedAt,
      imageUrl: uploaded[0] ?? null,
      sortOrder: count,
    },
  });

  revalidatePath("/admin/news");
  revalidatePath("/");
  redirect("/admin/news");
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

  const uploaded = await saveUploadedImages(data.files);
  const imageUrl = uploaded[0] ?? (data.keepImage || null);

  await prisma.newsArticle.update({
    where: { id },
    data: {
      title: data.title,
      excerpt: data.excerpt,
      publishedAt: data.publishedAt,
      imageUrl,
    },
  });

  revalidatePath("/admin/news");
  revalidatePath("/");
  redirect("/admin/news");
}

export async function deleteNewsAction(id: string) {
  await requireStaff();
  await prisma.newsArticle.delete({ where: { id } });
  revalidatePath("/admin/news");
  revalidatePath("/");
}
