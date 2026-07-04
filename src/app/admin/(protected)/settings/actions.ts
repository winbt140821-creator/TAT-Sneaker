"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { saveUploadedImages } from "@/lib/uploads";
import { getBankByBin } from "@/lib/vietqr-banks";

function revalidateSettings() {
  revalidatePath("/admin/settings", "layout");
  revalidatePath("/");
}

export async function updateLogoAction(formData: FormData): Promise<void> {
  await requireStaff();

  const remove = formData.get("remove") === "on";
  const file = formData.get("image");
  const files = file instanceof File && file.size > 0 ? [file] : [];
  const uploaded = await saveUploadedImages(files);

  if (remove) {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { logoUrl: null },
      create: { id: "singleton", logoUrl: null },
    });
  } else if (uploaded[0]) {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { logoUrl: uploaded[0] },
      create: { id: "singleton", logoUrl: uploaded[0] },
    });
  }

  revalidateSettings();
}

export async function updateHeroImageAction(formData: FormData): Promise<void> {
  await requireStaff();

  const remove = formData.get("remove") === "on";
  const file = formData.get("image");
  const files = file instanceof File && file.size > 0 ? [file] : [];
  const uploaded = await saveUploadedImages(files);

  if (remove) {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { heroImageUrl: null },
      create: { id: "singleton", heroImageUrl: null },
    });
  } else if (uploaded[0]) {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { heroImageUrl: uploaded[0] },
      create: { id: "singleton", heroImageUrl: uploaded[0] },
    });
  }

  revalidateSettings();
}

async function updateQrFieldAction(
  field: "vnpayQrUrl" | "paypalQrUrl" | "bankTransferQrUrl",
  formData: FormData
): Promise<void> {
  await requireStaff();

  const remove = formData.get("remove") === "on";
  const file = formData.get("image");
  const files = file instanceof File && file.size > 0 ? [file] : [];
  const uploaded = await saveUploadedImages(files);

  if (remove) {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { [field]: null },
      create: { id: "singleton", [field]: null },
    });
  } else if (uploaded[0]) {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { [field]: uploaded[0] },
      create: { id: "singleton", [field]: uploaded[0] },
    });
  }

  revalidateSettings();
}

export const updateVnpayQrAction = updateQrFieldAction.bind(null, "vnpayQrUrl");
export const updatePaypalQrAction = updateQrFieldAction.bind(null, "paypalQrUrl");
export const updateBankTransferQrAction = updateQrFieldAction.bind(null, "bankTransferQrUrl");

export async function updateBankTransferInfoAction(formData: FormData): Promise<void> {
  await requireStaff();

  const bankBin = String(formData.get("bankBin") ?? "").trim() || null;
  const bank = bankBin ? getBankByBin(bankBin) : undefined;

  const data = {
    bankBin,
    bankName: bank?.name ?? null,
    bankAccountNumber: String(formData.get("bankAccountNumber") ?? "").trim() || null,
    bankAccountHolder: String(formData.get("bankAccountHolder") ?? "").trim() || null,
  };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  revalidateSettings();
}

export async function updateContactInfoAction(formData: FormData): Promise<void> {
  await requireStaff();

  const data = {
    address: String(formData.get("address") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    footerAbout: String(formData.get("footerAbout") ?? "").trim() || null,
  };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  revalidateSettings();
}

export async function updateMarketingSettingsAction(formData: FormData): Promise<void> {
  await requireStaff();

  const data = {
    metaPixelId: String(formData.get("metaPixelId") ?? "").trim() || null,
  };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  revalidateSettings();
}

export async function updateHeroContentAction(formData: FormData): Promise<void> {
  await requireStaff();

  const data = {
    heroEyebrow: String(formData.get("heroEyebrow") ?? "").trim() || null,
    heroEyebrowEnabled: formData.get("heroEyebrowEnabled") === "on",
    heroHeading: String(formData.get("heroHeading") ?? "").trim() || null,
    heroHeadingEnabled: formData.get("heroHeadingEnabled") === "on",
    heroDescription: String(formData.get("heroDescription") ?? "").trim() || null,
    heroDescriptionEnabled: formData.get("heroDescriptionEnabled") === "on",
    heroStatsEnabled: formData.get("heroStatsEnabled") === "on",
    heroStat1Value: String(formData.get("heroStat1Value") ?? "").trim() || null,
    heroStat1Label: String(formData.get("heroStat1Label") ?? "").trim() || null,
    heroStat2Value: String(formData.get("heroStat2Value") ?? "").trim() || null,
    heroStat2Label: String(formData.get("heroStat2Label") ?? "").trim() || null,
    heroStat3Value: String(formData.get("heroStat3Value") ?? "").trim() || null,
    heroStat3Label: String(formData.get("heroStat3Label") ?? "").trim() || null,
  };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  revalidateSettings();
}

async function updateExchangeRateAction(
  field: "usdExchangeRate" | "cnyExchangeRate",
  formData: FormData
): Promise<void> {
  await requireStaff();

  const raw = String(formData.get(field) ?? "").trim();
  const rate = raw ? Math.round(Number(raw)) : null;

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { [field]: rate && rate > 0 ? rate : null },
    create: { id: "singleton", [field]: rate && rate > 0 ? rate : null },
  });

  revalidateSettings();
}

export const updateUsdExchangeRateAction = updateExchangeRateAction.bind(null, "usdExchangeRate");
export const updateCnyExchangeRateAction = updateExchangeRateAction.bind(null, "cnyExchangeRate");

export async function updateAutoCancelHoursAction(formData: FormData): Promise<void> {
  await requireStaff();

  const raw = String(formData.get("autoCancelUnpaidDepositHours") ?? "").trim();
  const hours = raw ? Math.round(Number(raw)) : null;
  const value = hours && hours > 0 ? hours : null;

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { autoCancelUnpaidDepositHours: value },
    create: { id: "singleton", autoCancelUnpaidDepositHours: value },
  });

  revalidateSettings();
}

// Kept in sync with SOCIAL_PLATFORMS in page.tsx — the icon picker only
// ever submits one of these values, this just rejects tampered requests.
const ALLOWED_SOCIAL_PLATFORMS = ["Facebook", "Messenger", "TikTok", "Zalo", "Instagram", "YouTube"];

export async function createSocialLinkAction(formData: FormData): Promise<void> {
  await requireStaff();

  const platform = String(formData.get("platform") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!ALLOWED_SOCIAL_PLATFORMS.includes(platform) || !url) return;

  const count = await prisma.socialLink.count();
  await prisma.socialLink.create({
    data: { platform, url, sortOrder: count },
  });

  revalidateSettings();
}

export async function toggleSocialLinkAction(id: string): Promise<void> {
  await requireStaff();
  const link = await prisma.socialLink.findUnique({ where: { id } });
  if (!link) return;
  await prisma.socialLink.update({ where: { id }, data: { enabled: !link.enabled } });
  revalidateSettings();
}

export async function deleteSocialLinkAction(id: string): Promise<void> {
  await requireStaff();
  await prisma.socialLink.delete({ where: { id } });
  revalidateSettings();
}
