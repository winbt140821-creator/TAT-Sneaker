"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { readDepartment } from "@/lib/admin-store";
import { publishToTarget, type PublishTarget } from "@/lib/meta";
import type { Department } from "@/lib/inventory";

export type ComposeFormState = { error?: string; ok?: boolean };

function readCompose(formData: FormData) {
  const message = String(formData.get("message") ?? "").trim();
  const images = formData.getAll("images").map(String).filter(Boolean);
  const targetIds = formData.getAll("targetIds").map(String).filter(Boolean);
  const productId = String(formData.get("productId") ?? "").trim() || null;
  return { message, images, targetIds, productId, department: readDepartment(formData.get("department")) };
}

/** Which store a post belongs to (for the history list): the picked
 *  product's store, else the store it was composed under, else none. */
async function postDepartment(productId: string | null, department: Department | null) {
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { department: true } });
    if (product) return product.department;
  }
  return department;
}

async function loadTargets(targetIds: string[]): Promise<PublishTarget[]> {
  const accounts = await prisma.socialAccount.findMany({ where: { id: { in: targetIds } } });
  return accounts.map((a) => ({
    id: a.id,
    platform: a.platform,
    pageId: a.pageId,
    igUserId: a.igUserId,
    accessToken: a.accessToken,
    name: a.name,
  }));
}

export async function publishNowAction(
  _prevState: ComposeFormState,
  formData: FormData
): Promise<ComposeFormState> {
  await requireStaff();
  const { message, images, targetIds, productId, department } = readCompose(formData);
  if (targetIds.length === 0) return { error: "Hãy chọn ít nhất 1 trang để đăng." };

  const targets = await loadTargets(targetIds);
  const results = await Promise.all(
    targets.map(async (t) => {
      try {
        const r = await publishToTarget(t, { message, images, productId });
        return { targetId: t.id, name: t.name, ok: true, link: r.url };
      } catch (err) {
        return {
          targetId: t.id,
          name: t.name,
          ok: false,
          error: err instanceof Error ? err.message : "Lỗi không xác định",
        };
      }
    })
  );

  await prisma.socialPost.create({
    data: {
      message,
      images: JSON.stringify(images),
      targetIds: JSON.stringify(targetIds),
      productId,
      department: await postDepartment(productId, department),
      status: results.every((r) => r.ok) ? "PUBLISHED" : "PARTIAL",
      results: JSON.stringify(results),
      publishedAt: new Date(),
    },
  });

  revalidatePath("/admin/social");

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    return { error: failed.map((f) => `${f.name}: ${f.error}`).join(" | ") };
  }
  return { ok: true };
}

export async function schedulePostAction(
  _prevState: ComposeFormState,
  formData: FormData
): Promise<ComposeFormState> {
  await requireStaff();
  const { message, images, targetIds, productId, department } = readCompose(formData);
  const scheduledAt = String(formData.get("scheduledAt") ?? "");
  if (targetIds.length === 0) return { error: "Hãy chọn ít nhất 1 trang để đăng." };
  if (!scheduledAt) return { error: "Hãy chọn thời gian hẹn giờ." };

  await prisma.socialPost.create({
    data: {
      message,
      images: JSON.stringify(images),
      targetIds: JSON.stringify(targetIds),
      productId,
      department: await postDepartment(productId, department),
      status: "SCHEDULED",
      scheduledAt: new Date(scheduledAt),
    },
  });

  revalidatePath("/admin/social");
  return { ok: true };
}

export async function deleteSocialPostAction(id: string) {
  await requireStaff();
  await prisma.socialPost.delete({ where: { id } });
  revalidatePath("/admin/social");
}

// Ngắt kết nối TỪNG tài khoản theo id — không xoá hàng loạt, để ngắt 1 Page
// lỗi/hết hạn mà không ảnh hưởng các Page/Instagram khác đang kết nối tốt.
export async function disconnectSocialAccountAction(id: string) {
  await requireStaff();
  await prisma.socialAccount.delete({ where: { id } });
  revalidatePath("/admin/social");
}

export async function updateSocialPostTemplateAction(department: Department, formData: FormData): Promise<void> {
  await requireStaff();
  const socialPostTemplate = String(formData.get("socialPostTemplate") ?? "").trim() || null;

  await prisma.storefrontBranding.upsert({
    where: { department },
    update: { socialPostTemplate },
    create: { department, socialPostTemplate },
  });

  // getBranding() sits behind a 60s cache — see settings/actions.ts.
  updateTag("storefront-branding");
  revalidatePath("/admin/social");
}

// Which store a connected page posts for (null = both).
export async function setSocialAccountStoreAction(id: string, formData: FormData): Promise<void> {
  await requireStaff();
  await prisma.socialAccount.update({
    where: { id },
    data: { department: readDepartment(formData.get("department")) },
  });
  revalidatePath("/admin/social");
}
