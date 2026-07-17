"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { getBankByBin } from "@/lib/vietqr-banks";

function revalidateSettings() {
  revalidatePath("/admin/settings", "layout");
  revalidatePath("/");
}

export async function updateLogoAction(formData: FormData): Promise<void> {
  await requireStaff();

  const remove = formData.get("remove") === "on";
  const newUrl = String(formData.get("image") ?? "").trim() || null;

  if (remove) {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { logoUrl: null },
      create: { id: "singleton", logoUrl: null },
    });
  } else if (newUrl) {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { logoUrl: newUrl },
      create: { id: "singleton", logoUrl: newUrl },
    });
  }

  revalidateSettings();
}

export async function updateHeroImagesAction(formData: FormData): Promise<void> {
  await requireStaff();

  const heroImages = formData.getAll("images").map(String);

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { heroImages: JSON.stringify(heroImages) },
    create: { id: "singleton", heroImages: JSON.stringify(heroImages) },
  });

  revalidateSettings();
}

async function updateQrFieldAction(
  field: "vnpayQrUrl" | "paypalQrUrl" | "bankTransferQrUrl",
  formData: FormData
): Promise<void> {
  await requireStaff();

  const remove = formData.get("remove") === "on";
  const newUrl = String(formData.get("image") ?? "").trim() || null;

  if (remove) {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { [field]: null },
      create: { id: "singleton", [field]: null },
    });
  } else if (newUrl) {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { [field]: newUrl },
      create: { id: "singleton", [field]: newUrl },
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
    metaCapiAccessToken: String(formData.get("metaCapiAccessToken") ?? "").trim() || null,
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

export async function updateAutoCancelCodHoursAction(formData: FormData): Promise<void> {
  await requireStaff();

  const raw = String(formData.get("autoCancelUnpaidCodHours") ?? "").trim();
  const hours = raw ? Math.round(Number(raw)) : null;
  const value = hours && hours > 0 ? hours : null;

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { autoCancelUnpaidCodHours: value },
    create: { id: "singleton", autoCancelUnpaidCodHours: value },
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
  // One raw UPDATE instead of a read-then-write — see toggleProductHiddenAction.
  await prisma.$executeRaw`UPDATE "SocialLink" SET "enabled" = NOT "enabled" WHERE "id" = ${id}`;
  revalidateSettings();
}

export async function deleteSocialLinkAction(id: string): Promise<void> {
  await requireStaff();
  await prisma.socialLink.delete({ where: { id } });
  revalidateSettings();
}

export async function updateDefaultProductDescriptionAction(formData: FormData): Promise<void> {
  await requireStaff();

  const defaultProductDescription = String(formData.get("defaultProductDescription") ?? "").trim() || null;

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { defaultProductDescription },
    create: { id: "singleton", defaultProductDescription },
  });

  revalidateSettings();
}
