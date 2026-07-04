import { site } from "@/lib/site-config";
import { getSiteSettings, getSocialLinks } from "@/lib/settings";
import { SITE_URL } from "@/lib/seo";

// Renders once per page load via the root layout — lets Google build a
// Knowledge Panel / sitelinks search box for the store as a whole, not just
// individual pages. Inert data, safe to include even on admin routes.
export async function OrganizationJsonLd() {
  const [settings, socialLinks] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
  ]);

  const json = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: site.name,
    url: SITE_URL,
    description: site.tagline,
    ...(settings?.phone ? { telephone: settings.phone } : {}),
    ...(settings?.email ? { email: settings.email } : {}),
    ...(settings?.address ? { address: { "@type": "PostalAddress", streetAddress: settings.address } } : {}),
    ...(socialLinks.length > 0 ? { sameAs: socialLinks.map((l) => l.url) } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
