import type { Metadata } from "next";
import { Noto_Serif_Display, Inter_Tight, Permanent_Marker } from "next/font/google";
import { site } from "@/lib/site-config";
import { SITE_URL } from "@/lib/seo";
import { getSiteSettings, getBranding } from "@/lib/settings";
import { getDepartment } from "@/lib/department";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { MetaPixel } from "@/components/MetaPixel";
import { DepartmentProvider } from "@/i18n/navigation";
import "./globals.css";

// One type system for both stores (owner's pick, Sept 2026: the clothing
// store's): a high-contrast Didone for headings and one neutral grotesque
// for everything else — nav, labels, prices, body. The way COS and Zara set
// type. Noto Serif Display rather than Bodoni Moda, which has no Vietnamese
// subset (every diacritic would fall back to another font mid-word).
// Headings run light (300/400, see .font-display in globals.css); 700 is
// only for the heavy half of the gateway wordmark. Browsers download only
// the weights a page actually renders.
const notoSerifDisplay = Noto_Serif_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "700"],
});

const interTight = Inter_Tight({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});

// Marker/brush display face used only by BrandLogo's wordmark, matching the
// hand-drawn sticker style of the reference logo.
const permanentMarker = Permanent_Marker({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: "400",
});

const DEFAULT_TITLE = `${site.name} — Không Rẻ Nhất, Nhưng Đáng Tiền Nhất`;
const DEFAULT_DESCRIPTION = site.tagline;

// Async so we can fall back to the admin-uploaded hero/logo image as the
// default share image (og:image) — otherwise every non-product page (home,
// static pages, category listings) shares with no image at all.
export async function generateMetadata(): Promise<Metadata> {
  const department = await getDepartment();
  const branding = await getBranding(department);
  const firstHeroImage: string | undefined = branding?.heroImages
    ? JSON.parse(branding.heroImages)[0]
    : undefined;
  const ogImage = firstHeroImage || branding?.heroImageUrl || branding?.logoUrl || undefined;
  const siteUrl = SITE_URL;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: `%s | ${site.name}`,
      default: DEFAULT_TITLE,
    },
    description: DEFAULT_DESCRIPTION,
    robots: { index: true, follow: true },
    verification: {
      other: { "facebook-domain-verification": "04pcggc6wyxa7rew8kc14cpxpb2rhu" },
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: site.name,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: siteUrl,
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
  const settings = await getSiteSettings();
  // Already dynamic regardless: generateMetadata above calls getDepartment()
  // too, which forces this route to render per-request — so this second
  // call doesn't add any caching cost beyond what's already paid.
  const department = await getDepartment();
  // Both stores share one type system (see the font loaders above).
  const fontVariables = `${notoSerifDisplay.variable} ${interTight.variable} ${permanentMarker.variable}`;

  return (
    // Deliberately hardcoded rather than getLocale() — that call falls back
    // to reading headers() when invoked before the child [locale]/layout.tsx
    // has run setRequestLocale(), which is always true here since parents
    // render before children. That forced every single customer page to
    // skip static rendering/caching entirely just for this attribute — a
    // real perf cost (verified: product pages served Cache-Control: no-store
    // on every request) for a value that isn't even locale-aware anywhere
    // else in this file (title/description/og:locale below are already
    // hardcoded Vietnamese regardless of visitor locale).
    <html
      lang="vi"
      data-department={department.toLowerCase()}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">
        <DepartmentProvider department={department}>{children}</DepartmentProvider>
        <OrganizationJsonLd />
        {settings?.metaPixelId && <MetaPixel pixelId={settings.metaPixelId} />}
      </body>
    </html>
  );
}
