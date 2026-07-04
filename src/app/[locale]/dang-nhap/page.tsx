import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { auth } from "@/auth";
import { GoogleIcon, FacebookIcon } from "@/components/icons";
import { redirectGuard } from "@/i18n/navigation";
import { loginWithGoogleAction, loginWithFacebookAction } from "./actions";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const [session, locale, t] = await Promise.all([auth(), getLocale(), getTranslations("login")]);
  if (session?.user) redirectGuard({ href: callbackUrl || "/", locale });

  return (
    <>
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={[t("breadcrumb")]} />

        <div className="mx-auto flex max-w-sm flex-col px-4 py-12 sm:px-6">
          <div className="die-cut bg-paper p-8">
            <p className="font-display text-xl text-ink">{t("title")}</p>
            <p className="mt-1 font-mono text-xs text-graphite">{t("subtitle")}</p>

            {error && (
              <p role="alert" className="mt-4 font-mono text-xs text-stamp">
                {t("error")}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <form action={loginWithGoogleAction.bind(null, callbackUrl)}>
                <button
                  type="submit"
                  className="die-cut-flat flex w-full cursor-pointer items-center justify-center gap-2 border border-graphite bg-paper px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:border-ink"
                >
                  <GoogleIcon className="h-4 w-4" />
                  {t("withGoogle")}
                </button>
              </form>

              <form action={loginWithFacebookAction.bind(null, callbackUrl)}>
                <button
                  type="submit"
                  className="die-cut-flat flex w-full cursor-pointer items-center justify-center gap-2 bg-[#1877F2] px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-[#1461cc]"
                >
                  <FacebookIcon className="h-4 w-4" />
                  {t("withFacebook")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
