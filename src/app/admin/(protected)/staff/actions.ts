"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, invalidateStaffSessions, requireAdmin } from "@/lib/auth";

export type StaffFormState = { error?: string };

function readRole(formData: FormData): "ADMIN" | "STAFF" {
  return String(formData.get("role") ?? "STAFF") === "ADMIN" ? "ADMIN" : "STAFF";
}

export async function createStaffAction(
  _prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = readRole(formData);

  if (!name || !email || !password) {
    return { error: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu." };
  }
  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  try {
    await prisma.staff.create({
      data: { name, email, passwordHash: await hashPassword(password), role },
    });
  } catch {
    return { error: `Email "${email}" đã được sử dụng.` };
  }

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function updateStaffAction(
  id: string,
  _prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  const current = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = readRole(formData);

  if (!name || !email) {
    return { error: "Vui lòng nhập đầy đủ họ tên và email." };
  }
  if (password && password.length < 6) {
    return { error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
  }
  if (current.id === id && role !== "ADMIN") {
    return { error: "Bạn không thể tự hạ quyền của chính mình." };
  }

  try {
    await prisma.staff.update({
      where: { id },
      data: {
        name,
        email,
        role,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });
  } catch {
    return { error: `Email "${email}" đã được sử dụng.` };
  }

  // A new password should also kill any session issued under the old
  // one — including the caller's own, if they just changed their own
  // password — so a leaked old token can't keep working for 7 more days.
  if (password) {
    await invalidateStaffSessions(id);
  }

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function deleteStaffAction(id: string) {
  const current = await requireAdmin();
  if (current.id === id) {
    throw new Error("Bạn không thể xóa chính tài khoản đang đăng nhập.");
  }

  const target = await prisma.staff.findUnique({ where: { id } });
  if (target?.role === "ADMIN") {
    const adminCount = await prisma.staff.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new Error("Không thể xóa quản trị viên cuối cùng.");
    }
  }

  await prisma.staff.delete({ where: { id } });
  revalidatePath("/admin/staff");
}
