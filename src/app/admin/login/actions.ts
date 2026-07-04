"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string };

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." };
  }

  const staff = await prisma.staff.findUnique({ where: { email } });

  if (staff?.lockedUntil && staff.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((staff.lockedUntil.getTime() - Date.now()) / 60000);
    return {
      error: `Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`,
    };
  }

  const valid = staff && (await verifyPassword(password, staff.passwordHash));

  if (!valid) {
    // Only a real staff row gets a lockout counter — a nonexistent email
    // can't accumulate attempts, so this can't be used to enumerate emails.
    if (staff) {
      const attempts = staff.failedLoginAttempts + 1;
      const lockingOut = attempts >= MAX_FAILED_ATTEMPTS;
      await prisma.staff.update({
        where: { id: staff.id },
        data: {
          failedLoginAttempts: lockingOut ? 0 : attempts,
          lockedUntil: lockingOut ? new Date(Date.now() + LOCKOUT_MS) : null,
        },
      });
    }
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  if (staff.failedLoginAttempts > 0 || staff.lockedUntil) {
    await prisma.staff.update({
      where: { id: staff.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  await createSession(staff.id);
  redirect("/admin");
}

export async function loginWithGoogleAction() {
  await signIn("google", { redirectTo: "/admin/google-callback" });
}
