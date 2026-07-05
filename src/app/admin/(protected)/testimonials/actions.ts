"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

export type TestimonialFormState = { error?: string };

function readTestimonialForm(formData: FormData) {
  const quote = String(formData.get("quote") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();
  const newAvatar = String(formData.get("avatar") ?? "").trim();
  const keepAvatar = String(formData.get("keepAvatar") ?? "");

  return { quote, authorName, newAvatar, keepAvatar };
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

  const count = await prisma.testimonial.count();

  await prisma.testimonial.create({
    data: {
      quote: data.quote,
      authorName: data.authorName,
      avatarUrl: data.newAvatar || null,
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

  const avatarUrl = data.newAvatar || data.keepAvatar || null;

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
