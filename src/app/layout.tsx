import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Sans, Permanent_Marker, Fraunces, Montserrat, IBM_Plex_Mono } from "next/font/google";
import { site } from "@/lib/site-config";
import { siteUrlForDepartment } from "@/lib/seo";
import { getSiteSettings, getBranding } from "@/lib/settings";
import { getDepartment } from "@/lib/department";
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

// Clothing storefront's own type system — see globals.css's
// `[data-department="clothing"]` block, which re-points --font-display/
// --font-body/--font-mono at these instead of the shoe fonts above.
// Distinct variable names so all pairs can be loaded side by side without
// colliding; only the active department's classes are applied to <html>
// below, so a given request's HTML never references the unused set.
// Fraunces (soft-serif, wide weight range) carries the brand's personality
// at display size — deliberately not a generic wedding-invitation serif.
const fraunces = Fraunces({
  variable: "--font-display-clothing",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  variable: "--font-body-clothing",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
});

// "Spec sheet" utility face for prices, SKUs, sizes, stock counts — a real
// monospace instead of aliasing the display serif (the shoe site's
// font-mono utility literally IS its display font; that reads fine for
// bold uppercase sneaker-drop labels, but serif-at-11px reads muddy for
// small data-like text). Ties to the parent brand's actual differentiator
// (every product page shows inspected/verified fabric+construction specs)
// instead of decorating for its own sake.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono-clothing",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
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
  const siteUrl = siteUrlForDepartment(department);

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
  const fontVariables =
    department === "CLOTHING"
      ? `${fraunces.variable} ${montserrat.variable} ${ibmPlexMono.variable}`
      : `${beVietnamPro.variable} ${notoSans.variable} ${permanentMarker.variable}`;

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
        {children}
        <OrganizationJsonLd />
        {settings?.metaPixelId && <MetaPixel pixelId={settings.metaPixelId} />}
      </body>
    </html>
  );
}
