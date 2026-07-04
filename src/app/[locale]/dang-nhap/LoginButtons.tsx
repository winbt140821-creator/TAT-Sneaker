"use client";

import { signIn } from "next-auth/react";
import { GoogleIcon, FacebookIcon } from "@/components/icons";

// NextAuth v5's signIn() called from a Server Action hits a known CSRF bug
// on Next.js 16 (https://github.com/nextauthjs/next-auth/issues/13388) —
// calling the client-side signIn() here instead avoids it entirely.
export function LoginButtons({
  callbackUrl,
  showFacebook,
  withGoogleLabel,
  withFacebookLabel,
}: {
  callbackUrl?: string;
  showFacebook: boolean;
  withGoogleLabel: string;
  withFacebookLabel: string;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: callbackUrl || "/" })}
        className="die-cut-flat flex w-full cursor-pointer items-center justify-center gap-2 border border-graphite bg-paper px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:border-ink"
      >
        <GoogleIcon className="h-4 w-4" />
        {withGoogleLabel}
      </button>

      {showFacebook && (
        <button
          type="button"
          onClick={() => signIn("facebook", { callbackUrl: callbackUrl || "/" })}
          className="die-cut-flat flex w-full cursor-pointer items-center justify-center gap-2 bg-[#1877F2] px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-[#1461cc]"
        >
          <FacebookIcon className="h-4 w-4" />
          {withFacebookLabel}
        </button>
      )}
    </div>
  );
}
