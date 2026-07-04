export type Quality = "Auth" | "Best Quality" | "Rep 11";

export type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  quality: Quality;
  accent: string;
  sizes: number[]; // available sizes
  soldSizes: number[]; // sold-out sizes, shown struck through
};

const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

function pickSizes(seed: number) {
  const sold = ALL_SIZES.filter((_, i) => (i + seed) % 4 === 0);
  const available = ALL_SIZES.filter((s) => !sold.includes(s));
  return { available, sold };
}

const NAMES: { brand: string; name: string; accent: string }[] = [
  { brand: "Jordan", name: "Retro Low '85", accent: "#c13a2e" },
  { brand: "Nike", name: "Air Court Classic", accent: "#33507a" },
  { brand: "adidas", name: "Terrace OG", accent: "#4a4638" },
  { brand: "New Balance", name: "990 Heritage", accent: "#6b6350" },
  { brand: "Nike", name: "Zoom Trail Max", accent: "#c13a2e" },
  { brand: "Jordan", name: "Mid Wing '93", accent: "#33507a" },
  { brand: "adidas", name: "Boost Runner", accent: "#c13a2e" },
  { brand: "New Balance", name: "574 Classic", accent: "#4a4638" },
  { brand: "Nike", name: "Air Volt High", accent: "#33507a" },
  { brand: "Jordan", name: "Retro OG '88", accent: "#c13a2e" },
  { brand: "adidas", name: "Superstar Court", accent: "#4a4638" },
  { brand: "New Balance", name: "2002 Protection", accent: "#6b6350" },
  { brand: "Nike", name: "Dunk Panel Low", accent: "#c13a2e" },
  { brand: "Jordan", name: "Flight Club '01", accent: "#33507a" },
  { brand: "adidas", name: "Forum Stack", accent: "#c13a2e" },
  { brand: "New Balance", name: "1906 Runner", accent: "#4a4638" },
  { brand: "Nike", name: "Air Ridge Low", accent: "#33507a" },
  { brand: "Jordan", name: "Retro Low '97", accent: "#c13a2e" },
  { brand: "adidas", name: "Trail Wave", accent: "#4a4638" },
  { brand: "New Balance", name: "993 Suede", accent: "#6b6350" },
  { brand: "Puma", name: "Suede Classic", accent: "#4a4638" },
  { brand: "Puma", name: "RS-X Reinvent", accent: "#c13a2e" },
  { brand: "Salomon", name: "XT-6 Trail", accent: "#33507a" },
  { brand: "Salomon", name: "Speedcross 5", accent: "#4a4638" },
  { brand: "Maison Margiela", name: "Replica Low", accent: "#6b6350" },
  { brand: "Bape Sta", name: "Patent Leather", accent: "#c13a2e" },
];

export const products: Product[] = NAMES.map((n, i) => {
  const { available, sold } = pickSizes(i);
  const skuLetters = n.brand.slice(0, 2).toUpperCase();
  const price = 1890000 + i * 145000;
  const onSale = i % 4 === 1;
  return {
    id: `p-${i + 1}`,
    sku: `${skuLetters}-${(1000 + i * 37).toString().padStart(5, "0")}`,
    name: `${n.brand} ${n.name}`,
    brand: n.brand,
    price,
    originalPrice: onSale ? Math.round((price * 1.2) / 10000) * 10000 : undefined,
    quality: (["Auth", "Best Quality", "Rep 11"] as const)[i % 3],
    accent: n.accent,
    sizes: available,
    soldSizes: sold,
  };
});
