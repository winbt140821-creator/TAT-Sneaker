import { absoluteUrl } from "@/lib/seo";
import { hasAnyStock } from "@/lib/inventory";
import type { CatalogProduct } from "@/lib/catalog";

export function ProductJsonLd({
  product,
  brandLabel,
}: {
  product: CatalogProduct;
  brandLabel?: string;
}) {
  const url = absoluteUrl(`/san-pham/${product.id}`);
  const hasStock = hasAnyStock(product.sizeQuantities);
  const availability =
    product.availability === "PREORDER"
      ? "https://schema.org/PreOrder"
      : hasStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    url,
    ...(product.images.length > 0 ? { image: product.images.map((i) => absoluteUrl(i)) } : {}),
    ...(brandLabel ? { brand: { "@type": "Brand", name: brandLabel } } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "VND",
      price: product.price,
      availability,
      itemCondition:
        product.condition === "Cũ"
          ? "https://schema.org/UsedCondition"
          : "https://schema.org/NewCondition",
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}
