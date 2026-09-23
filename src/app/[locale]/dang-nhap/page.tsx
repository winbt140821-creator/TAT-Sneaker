import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { auth } from "@/auth";
import { redirectGuard } from "@/i18n/navigation";
import { getDepartment } from "@/lib/department";
import { storeHref } from "@/lib/store-path";
import { LoginButtons } from "./LoginButtons";

export const metadata: Metadata = { robots: { index: false, follow: true } };

// Facebook Login setup (App Review / Business Verification) isn't finished
// yet — flip this back to true once it's ready for real customers. The
// backend route stays wired up either way; this only hides the button so
// no one stumbles onto a login flow that isn't fully working yet.
const FACEBOOK_LOGIN_ENABLED = false;

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const [session, locale, t, department] = await Promise.all([
    auth(),
    getLocale(),
    getTranslations("login"),
    getDepartment(),
  ]);
  // Only same-site paths — "//evil.com" or "https://…" would otherwise turn
  // this into an open redirect. The path is store-agnostic ("/tai-khoan")
  // and lands back inside whichever store the shopper signed in from.
  const safeCallback = callbackUrl && /^\/(?![/\\])/.test(callbackUrl) ? callbackUrl : "/";
  const returnTo = storeHref(department, safeCallback);
  if (session?.user) redirectGuard({ href: returnTo, locale });

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

            <LoginButtons
              callbackUrl={returnTo}
              showFacebook={FACEBOOK_LOGIN_ENABLED && Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET)}
              withGoogleLabel={t("withGoogle")}
              withFacebookLabel={t("withFacebook")}
            />
          </div>
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
