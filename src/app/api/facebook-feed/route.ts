import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";
import { parseSizeQuantities, hasAnyStock } from "@/lib/inventory";

// Product feed for Meta Commerce Manager (Facebook/Instagram Shop). Follows
// the same RSS 2.0 + <g:*> namespace format as a Google Shopping feed, which
// Meta's catalog importer also accepts. Add this URL as a "Scheduled feed"
// in Commerce Manager so the catalog stays in sync with the database
// automatically instead of a one-off manual upload.
export const revalidate = 3600; // catalog data doesn't need to be second-fresh; re-fetched hourly at most

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function imageUrl(image: string): string {
  return image.startsWith("http") ? image : absoluteUrl(image);
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: { hidden: false },
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
      description: true,
      availability: true,
      sizeQuantities: true,
      categories: {
        select: { label: true, parentId: true, parent: { select: { label: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const items = products
    .map((p) => {
      const images: string[] = JSON.parse(p.images);
      if (images.length === 0) return null; // Meta rejects items with no image_link

      const sq = parseSizeQuantities(p.sizeQuantities);
      const gAvailability =
        p.availability === "PREORDER"
          ? "preorder"
          : hasAnyStock(sq)
            ? "in stock"
            : "out of stock";

      const category = p.categories[0];
      const brand = category ? (category.parent?.label ?? category.label) : "TAT Sneaker";
      const productType = category
        ? category.parent
          ? `${category.parent.label} > ${category.label}`
          : category.label
        : undefined;

      const link = absoluteUrl(`/san-pham/${p.id}`);
      const description = (p.description ?? p.name).slice(0, 5000);

      return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageUrl(images[0]))}</g:image_link>
${images
  .slice(1, 10)
  .map((img) => `      <g:additional_image_link>${escapeXml(imageUrl(img))}</g:additional_image_link>`)
  .join("\n")}
      <g:availability>${gAvailability}</g:availability>
      <g:price>${p.price} VND</g:price>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:condition>new</g:condition>${
        productType ? `\n      <g:product_type>${escapeXml(productType)}</g:product_type>` : ""
      }
    </item>`;
    })
    .filter((item): item is string => item !== null);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TAT Sneaker</title>
    <link>${escapeXml(absoluteUrl("/"))}</link>
    <description>Product catalog feed for Facebook/Instagram Shop</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
