// Clothing department's equivalent of SneakerArt — a stroke-only line-art
// fallback illustration shown when a product has no uploaded photo yet.
// Same viewBox/ground-shadow/accent-stroke convention as SneakerArt so the
// two drop into the same layout, but a garment silhouette instead of a
// shoe — without this, a clothing product with no photo showed a literal
// sneaker icon, undermining the whole point of a separate storefront.
type Silhouette = "tshirt" | "hoodie" | "jacket";

type GarmentDef = {
  body: string;
  details: string[];
};

const GARMENTS: Record<Silhouette, GarmentDef> = {
  tshirt: {
    body: "M75,32 L45,42 L52,60 L70,52 L70,104 L150,104 L150,52 L168,60 L175,42 L145,32 C140,20 126,15 110,15 C94,15 80,20 75,32 Z",
    details: [],
  },
  hoodie: {
    body: "M75,32 L45,42 L52,60 L70,52 L70,104 L150,104 L150,52 L168,60 L175,42 L145,32 C138,16 122,8 110,8 C98,8 82,16 75,32 Z",
    details: ["M100,20 L98,36", "M120,20 L122,36"],
  },
  jacket: {
    body: "M75,32 L45,42 L52,60 L70,52 L70,104 L150,104 L150,52 L168,60 L175,42 L145,32 L120,15 L110,28 L100,15 L75,32 Z",
    details: ["M110,28 L110,100"],
  },
};

export function GarmentArt({
  silhouette,
  accent,
  className,
}: {
  silhouette: Silhouette;
  accent: string;
  className?: string;
}) {
  const def = GARMENTS[silhouette];
  return (
    <svg
      viewBox="0 0 220 120"
      className={className}
      role="img"
      aria-label="Minh hoạ đường nét trang phục"
    >
      <ellipse cx="112" cy="106" rx="88" ry="7" fill="currentColor" className="text-ink/10" />
      <path
        d={def.body}
        fill="none"
        stroke={accent}
        strokeWidth={3.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {def.details.map((d, i) => (
        <path key={i} d={d} stroke={accent} strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
      ))}
      <path d="M14,104h192" stroke={accent} strokeWidth={2.5} strokeLinecap="round" opacity={0.35} />
    </svg>
  );
}

export function garmentSilhouetteFor(index: number): Silhouette {
  const order: Silhouette[] = ["tshirt", "hoodie", "jacket"];
  return order[index % order.length];
}
