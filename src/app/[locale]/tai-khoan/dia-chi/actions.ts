"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/account";

export type AddressInput = {
  fullName: string;
  phone: string;
  company: string;
  address: string;
  province: string;
  ward: string;
  zip: string;
  isDefault: boolean;
};

/** Server-side mirror of the form's `required` fields — a client can call
 * these actions directly, bypassing HTML validation entirely. */
function sanitizeAddressInput(input: AddressInput): AddressInput | null {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const address = input.address.trim();
  const province = input.province.trim();
  const ward = input.ward.trim();
  if (!fullName || !phone || !address || !province || !ward) return null;

  return {
    fullName,
    phone,
    address,
    province,
    ward,
    company: input.company.trim(),
    zip: input.zip.trim(),
    isDefault: input.isDefault,
  };
}

export async function createAddressAction(input: AddressInput) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Bạn cần đăng nhập." };

  const clean = sanitizeAddressInput(input);
  if (!clean) return { error: "Vui lòng nhập đầy đủ thông tin địa chỉ." };

  if (clean.isDefault) {
    await prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
  }
  await prisma.address.create({ data: { ...clean, customerId: customer.id } });
  revalidatePath("/tai-khoan/dia-chi", "layout");
  return { error: null };
}

export async function updateAddressAction(id: string, input: AddressInput) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Bạn cần đăng nhập." };

  const clean = sanitizeAddressInput(input);
  if (!clean) return { error: "Vui lòng nhập đầy đủ thông tin địa chỉ." };

  if (clean.isDefault) {
    await prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
  }
  const result = await prisma.address.updateMany({ where: { id, customerId: customer.id }, data: clean });
  if (result.count === 0) return { error: "Không tìm thấy địa chỉ." };

  revalidatePath("/tai-khoan/dia-chi", "layout");
  return { error: null };
}

export async function deleteAddressAction(id: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Bạn cần đăng nhập." };

  await prisma.address.deleteMany({ where: { id, customerId: customer.id } });
  revalidatePath("/tai-khoan/dia-chi", "layout");
  return { error: null };
}

export async function setDefaultAddressAction(id: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Bạn cần đăng nhập." };

  await prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
  await prisma.address.updateMany({ where: { id, customerId: customer.id }, data: { isDefault: true } });
  revalidatePath("/tai-khoan/dia-chi", "layout");
  return { error: null };
}
