import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getBranding } from "@/lib/settings";
import { languageAlternates } from "@/lib/seo";
import { Gateway } from "@/components/gateway/Gateway";

// The tatsneaker.vn gateway. Never linked or visited at this path: the proxy
// serves it for "/" (and "/en", "/zh") and sends /cua-ngo itself back to "/"
// — see routeStore() in src/proxy.ts.
//
// No admin screen of its own: each side shows the first cover photo of that
// store's homepage (Cài đặt > Trang chủ), so the photo that opens the store
// is the same one the shopper just chose. With no clothing cover photo
// uploaded yet, the clothing side falls back to a plain light panel.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("gateway");
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: { canonical: "/", languages: languageAlternates("/", null) },
  };
}

function coverPhoto(branding: Awaited<ReturnType<typeof getBranding>>): string | null {
  const images: string[] = branding?.heroImages ? JSON.parse(branding.heroImages) : [];
  return images[0] ?? branding?.heroImageUrl ?? null;
}

export default async function GatewayPage() {
  const [shoes, clothing, t] = await Promise.all([
    getBranding("SHOES"),
    getBranding("CLOTHING"),
    getTranslations("gateway"),
  ]);

  return (
    <main className="flex-1">
      <Gateway
        shoesImage={coverPhoto(shoes)}
        clothingImage={coverPhoto(clothing)}
        labels={{
          heading: t("heading"),
          shoesKicker: t("shoesKicker"),
          shoes: t("shoes"),
          shoesCta: t("shoesCta"),
          clothingKicker: t("clothingKicker"),
          clothing: t("clothing"),
          clothingCta: t("clothingCta"),
          enter: t("enter"),
        }}
      />
    </main>
  );
}
