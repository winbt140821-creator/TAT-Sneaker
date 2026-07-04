import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Sans, Permanent_Marker } from "next/font/google";
import { getLocale } from "next-intl/server";
import { site } from "@/lib/site-config";
import { SITE_URL } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { MetaPixel } from "@/components/MetaPixel";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
});

const notoSans = Noto_Sans({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
});

// Marker/brush display face used only by BrandLogo's wordmark, matching the
// hand-drawn sticker style of the reference logo — Be Vietnam Pro has no
// weight that reads as "hand-drawn".
const permanentMarker = Permanent_Marker({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: "400",
});

const DEFAULT_TITLE = `${site.name} — Giày Sneaker Chính Hãng`;
const DEFAULT_DESCRIPTION = site.tagline;

// Async so we can fall back to the admin-uploaded hero/logo image as the
// default share image (og:image) — otherwise every non-product page (home,
// static pages, category listings) shares with no image at all.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const firstHeroImage: string | undefined = settings?.heroImages
    ? JSON.parse(settings.heroImages)[0]
    : undefined;
  const ogImage = firstHeroImage || settings?.heroImageUrl || settings?.logoUrl || undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: `%s | ${site.name}`,
      default: DEFAULT_TITLE,
    },
    description: DEFAULT_DESCRIPTION,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: site.name,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: SITE_URL,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, settings] = await Promise.all([getLocale(), getSiteSettings()]);

  return (
    <html
      lang={locale}
      className={`${beVietnamPro.variable} ${notoSans.variable} ${permanentMarker.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">
        {children}
        <OrganizationJsonLd />
        {settings?.metaPixelId && <MetaPixel pixelId={settings.metaPixelId} />}
      </body>
    </html>
  );
}
