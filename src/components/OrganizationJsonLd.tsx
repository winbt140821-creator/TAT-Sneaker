import { site } from "@/lib/site-config";
import { getBranding, getSocialLinks } from "@/lib/settings";
import { getDepartment } from "@/lib/department";
import { SITE_URL } from "@/lib/seo";
import { jsonLdScript } from "@/lib/json-ld";

// Renders once per page load via the root layout — lets Google build a
// Knowledge Panel / sitelinks search box for the store as a whole, not just
// individual pages. Inert data, safe to include even on admin routes.
export async function OrganizationJsonLd() {
  // Contact details and profiles of the store being viewed (the gateway
  // and admin count as the shoe store, see getDepartment()).
  const department = await getDepartment();
  const [settings, socialLinks] = await Promise.all([
    getBranding(department),
    getSocialLinks(department),
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
      dangerouslySetInnerHTML={{ __html: jsonLdScript(json) }}
    />
  );
}
