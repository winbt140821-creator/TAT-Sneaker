import { getTranslations } from "next-intl/server";
import { absoluteUrl } from "@/lib/seo";
import { jsonLdScript } from "@/lib/json-ld";

// Structured-data twin of <Breadcrumb> — same trail, lets Google show the
// breadcrumb path in search results instead of the raw URL. First item is
// always the homepage; pass the rest of the trail with real paths.
export async function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const t = await getTranslations("common");
  const trail = [{ name: t("home"), path: "/" }, ...items];

  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(json) }} />
  );
}
