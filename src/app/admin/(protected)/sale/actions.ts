"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

export type SaleFormState = { error?: string };

function readSaleForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const discountPercent = Math.round(Number(formData.get("discountPercent") ?? 0));
  const appliesToAll = formData.get("appliesToAll") === "on";
  const productIds = formData.getAll("productIds").map(String);
  return { name, discountPercent, appliesToAll, productIds };
}

export async function createSaleCampaignAction(
  _prevState: SaleFormState,
  formData: FormData
): Promise<SaleFormState> {
  await requireStaff();
  const data = readSaleForm(formData);

  if (!data.name) return { error: "Vui lòng nhập tên đợt giảm giá." };
  if (!data.discountPercent || data.discountPercent < 1 || data.discountPercent > 90) {
    return { error: "Phần trăm giảm giá phải từ 1 đến 90." };
  }
  if (!data.appliesToAll && data.productIds.length === 0) {
    return { error: "Chọn ít nhất 1 sản phẩm, hoặc bật áp dụng cho toàn bộ sản phẩm." };
  }

  await prisma.saleCampaign.create({
    data: {
      name: data.name,
      discountPercent: data.discountPercent,
      appliesToAll: data.appliesToAll,
      products: data.appliesToAll ? undefined : { connect: data.productIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/admin/sale");
  revalidatePath("/");
  redirect("/admin/sale");
}

export async function toggleSaleCampaignAction(id: string): Promise<void> {
  await requireStaff();
  const campaign = await prisma.saleCampaign.findUnique({ where: { id } });
  if (!campaign) return;
  await prisma.saleCampaign.update({ where: { id }, data: { active: !campaign.active } });
  revalidatePath("/admin/sale");
  revalidatePath("/");
}

export async function deleteSaleCampaignAction(id: string): Promise<void> {
  await requireStaff();
  await prisma.saleCampaign.delete({ where: { id } });
  revalidatePath("/admin/sale");
  revalidatePath("/");
}
