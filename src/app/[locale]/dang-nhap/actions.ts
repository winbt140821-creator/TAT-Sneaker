"use server";

import { signIn } from "@/auth";

export async function loginWithGoogleAction(callbackUrl?: string) {
  await signIn("google", { redirectTo: callbackUrl || "/" });
}

export async function loginWithFacebookAction(callbackUrl?: string) {
  await signIn("facebook", { redirectTo: callbackUrl || "/" });
}
