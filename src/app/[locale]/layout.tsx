import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SessionProvider } from "next-auth/react";
import { HtmlLangSync } from "@/components/HtmlLangSync";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale}>
      {/* No `session` prop passed — SessionProvider fetches it client-side
          (GET /api/auth/session) after hydration instead of the server
          calling auth() here, which would force every customer page to skip
          static rendering/caching just to know the logged-in state. See
          Header.tsx / AccountMenu.tsx, which read it via useSession(). */}
      <SessionProvider>
        <HtmlLangSync />
        {/* Crossfade between pages on navigation (native View Transitions API,
            enabled via experimental.viewTransition in next.config.ts) — the
            sticky Header opts out via its own viewTransitionName so it doesn't
            flicker/crossfade along with the page content. */}
        <ViewTransition>{children}</ViewTransition>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
