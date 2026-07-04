"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { saveUploadedImages } from "@/lib/uploads";

export type TestimonialFormState = { error?: string };

function readTestimonialForm(formData: FormData) {
  const quote = String(formData.get("quote") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();
  const file = formData.get("avatar");
  const files = file instanceof File && file.size > 0 ? [file] : [];
  const keepAvatar = String(formData.get("keepAvatar") ?? "");

  return { quote, authorName, files, keepAvatar };
}

export async function createTestimonialAction(
  _prevState: TestimonialFormState,
  formData: FormData
): Promise<TestimonialFormState> {
  await requireStaff();
  const data = readTestimonialForm(formData);

  if (!data.quote || !data.authorName) {
    return { error: "Vui lòng nhập nội dung đánh giá và tên khách hàng." };
  }

  const uploaded = await saveUploadedImages(data.files);
  const count = await prisma.testimonial.count();

  await prisma.testimonial.create({
    data: {
      quote: data.quote,
      authorName: data.authorName,
      avatarUrl: uploaded[0] ?? null,
      sortOrder: count,
    },
  });

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  redirect("/admin/testimonials");
}

export async function updateTestimonialAction(
  id: string,
  _prevState: TestimonialFormState,
  formData: FormData
): Promise<TestimonialFormState> {
  await requireStaff();
  const data = readTestimonialForm(formData);

  if (!data.quote || !data.authorName) {
    return { error: "Vui lòng nhập nội dung đánh giá và tên khách hàng." };
  }

  const uploaded = await saveUploadedImages(data.files);
  const avatarUrl = uploaded[0] ?? (data.keepAvatar || null);

  await prisma.testimonial.update({
    where: { id },
    data: {
      quote: data.quote,
      authorName: data.authorName,
      avatarUrl,
    },
  });

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  redirect("/admin/testimonials");
}

export async function deleteTestimonialAction(id: string) {
  await requireStaff();
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}
