"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { DEFAULT_SIZE_CHART } from "@/lib/size-chart";

export async function addSizeChartRowAction(
  categoryId: string,
  formData: FormData
): Promise<void> {
  await requireStaff();

  const vnSize = String(formData.get("vnSize") ?? "").trim();
  const usSize = String(formData.get("usSize") ?? "").trim();
  const ukSize = String(formData.get("ukSize") ?? "").trim();
  const cmSize = String(formData.get("cmSize") ?? "").trim();
  if (!vnSize || !usSize || !ukSize || !cmSize) return;

  const count = await prisma.sizeChartRow.count({ where: { categoryId } });
  await prisma.sizeChartRow.create({
    data: { categoryId, vnSize, usSize, ukSize, cmSize, sortOrder: count },
  });

  revalidatePath(`/admin/categories/${categoryId}/size-chart`);
  revalidatePath("/san-pham", "layout");
}

export async function deleteSizeChartRowAction(
  categoryId: string,
  id: string
): Promise<void> {
  await requireStaff();
  await prisma.sizeChartRow.delete({ where: { id } });
  revalidatePath(`/admin/categories/${categoryId}/size-chart`);
  revalidatePath("/san-pham", "layout");
}

export async function useDefaultSizeChartAction(categoryId: string): Promise<void> {
  await requireStaff();

  await prisma.$transaction([
    prisma.sizeChartRow.deleteMany({ where: { categoryId } }),
    prisma.sizeChartRow.createMany({
      data: DEFAULT_SIZE_CHART.map((row, i) => ({
        categoryId,
        vnSize: row.vn,
        usSize: row.us,
        ukSize: row.uk,
        cmSize: row.cm,
        sortOrder: i,
      })),
    }),
  ]);

  revalidatePath(`/admin/categories/${categoryId}/size-chart`);
  revalidatePath("/san-pham", "layout");
}
