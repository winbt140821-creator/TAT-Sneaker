"use server";

import { signOut } from "@/auth";

export async function signOutCustomerAction() {
  await signOut({ redirectTo: "/" });
}
