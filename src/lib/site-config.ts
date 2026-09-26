import type { Department } from "./inventory";

export const site = {
  name: "TAT Sneaker",
  tagline: "1.000+ đôi sneaker. Mỗi đôi đều qua kiểm định.",
  hotline: "0900 000 000",
};

/** How each store names itself to search engines and link previews (page
 *  titles, Open Graph, structured data). The clothing store is TAT STORE —
 *  the same name its wordmark shows (ClothingWordmark). */
export const STORE_SITE: Record<Department, { name: string; title: string; description: string }> = {
  SHOES: {
    name: site.name,
    title: `${site.name} — Không Rẻ Nhất, Nhưng Đáng Tiền Nhất`,
    description: site.tagline,
  },
  CLOTHING: {
    name: "TAT STORE",
    title: "TAT STORE — Quần áo chọn lọc, mặc bền lâu",
    description:
      "Quần áo được chọn kỹ về chất liệu, đường may và phom dáng trước khi đến tay bạn. Giao hàng toàn quốc.",
  },
};

// Fallback contact email domain (used until an admin sets a real one in
// Site Settings) — strips spaces/punctuation so multi-word shop names like
// "TAT Sneaker" still produce a valid email, e.g. hello@tatsneaker.vn.
export const defaultContactEmail = `hello@${site.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.vn`;

export type NavCategory = {
  /** Label shown in the nav bar. */
  label: string;
  /** Matches Product["brand"] — drives the `?brand=` filter on the home page. */
  brand: string;
  /** Shows a flame icon next to the label (hyped / trending category). */
  hot?: boolean;
  /** Renders in the sale accent color instead of the default nav color. */
  sale?: boolean;
  /** Dropdown sub-items. Currently link to the same parent filter — see note in products.ts. */
  children?: string[];
};

// NOTE: this list is the single source of truth for the nav. Add a category
// by adding an entry here (and matching products in products.ts / the future
// admin panel) — no other file needs to change.
export const categories: NavCategory[] = [
  {
    label: "Jordan",
    brand: "Jordan",
    hot: true,
    children: [
      "x Travis Scott",
      "1's",
      "3's",
      "4's",
      "5's",
      "6's",
      "11's",
      "12's",
      "Legacy 312",
    ],
  },
  { label: "Nike", brand: "Nike" },
  { label: "adidas", brand: "adidas" },
  { label: "New Balance", brand: "New Balance" },
  { label: "Luxury", brand: "Luxury" },
  { label: "Puma", brand: "Puma" },
  { label: "Salomon", brand: "Salomon" },
  { label: "Maison Margiela", brand: "Maison Margiela" },
  { label: "Bape Sta", brand: "Bape Sta" },
  { label: "SALE – OFF", brand: "SALE", sale: true },
];
