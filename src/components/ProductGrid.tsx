import type { CatalogProduct } from "@/lib/catalog";
import type { Department } from "@/lib/inventory";
import { ProductCard } from "./ProductCard";
import { ClothingProductCard } from "./ClothingProductCard";
import { HorizontalScrollTrack } from "./HorizontalScrollTrack";

export function ProductGrid({
  products,
  layout = "grid",
  department = "SHOES",
  priorityCount = 0,
}: {
  products: CatalogProduct[];
  /** "scroll" = phone/tablet horizontal-scroll row (homepage brand teasers,
   *  each already capped at 8 — see HOME_SECTION_SIZE). "grid" = the default,
   *  a real responsive grid on every screen size (category/search listing
   *  pages with pagination, where "view all" must show everything, not a
   *  swipeable teaser). Ignored for clothing, which is always a grid. */
  layout?: "grid" | "scroll";
  department?: Department;
  /** Clothing only: how many leading tiles load eagerly (above-the-fold). */
  priorityCount?: number;
}) {
  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <p className="font-mono text-sm text-graphite">
          Không tìm thấy sản phẩm phù hợp.
        </p>
      </div>
    );
  }

  // Edge-to-edge portrait grid with hairline gutters, as on COS's listing
  // pages — no page-width container, no card chrome.
  if (department === "CLOTHING") {
    return (
      <div className="grid grid-cols-2 gap-x-0.5 gap-y-10 lg:grid-cols-4 lg:gap-y-12">
        {products.map((p, i) => (
          <ClothingProductCard key={p.id} product={p} index={i} priority={i < priorityCount} />
        ))}
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:px-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="lg:hidden">
        <HorizontalScrollTrack>
          {products.map((p, i) => (
            <div key={p.id} className="w-36 shrink-0 snap-start sm:w-40">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </HorizontalScrollTrack>
      </div>

      <div className="hidden lg:grid lg:grid-cols-4 lg:gap-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}
