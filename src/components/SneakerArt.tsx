type Silhouette = "low" | "high" | "runner";

type ShoeDef = {
  sole: string;
  upper: string;
  laces: string[];
};

const SHOES: Record<Silhouette, ShoeDef> = {
  low: {
    sole: "M22,90 C22,84 28,80 38,79 L188,75 C200,74 209,79 210,86 C211,93 204,99 193,100 L34,102 C26,102 21,96 22,90 Z",
    upper:
      "M30,84 C27,66 30,48 41,39 C50,32 61,28 72,27 C79,26 84,30 82,37 C80,44 87,45 95,42 L183,74 C186,78 184,83 177,85 L40,87 C34,87 31,86 30,84 Z",
    laces: ["M86,48 L102,59", "M93,43 L109,54", "M100,38 L116,49"],
  },
  high: {
    sole: "M22,90 C22,84 28,80 38,79 L188,75 C200,74 209,79 210,86 C211,93 204,99 193,100 L34,102 C26,102 21,96 22,90 Z",
    upper:
      "M32,84 C28,60 30,38 40,24 C46,15 55,11 63,13 C69,14 70,20 66,26 C71,26 76,29 74,35 C72,41 78,43 86,41 L183,74 C186,78 184,83 177,85 L40,87 C35,87 32,86 32,84 Z",
    laces: ["M84,46 L100,57", "M91,41 L107,52", "M98,36 L114,47"],
  },
  runner: {
    sole: "M20,92 C20,84 27,79 39,78 L189,73 C203,72 213,78 214,86 C215,94 207,101 194,102 L33,104 C24,104 19,99 20,92 Z",
    upper:
      "M30,86 C27,68 30,50 42,40 C51,33 62,29 73,28 C80,27 85,31 82,38 C79,45 86,46 94,43 L180,72 C184,76 182,81 174,84 L40,88 C34,88 31,88 30,86 Z",
    laces: ["M85,50 L103,60", "M92,45 L110,55", "M99,40 L117,50"],
  },
};

export function SneakerArt({
  silhouette,
  accent,
  className,
}: {
  silhouette: Silhouette;
  accent: string;
  className?: string;
}) {
  const def = SHOES[silhouette];
  return (
    <svg
      viewBox="0 0 220 120"
      className={className}
      role="img"
      aria-label="Minh hoạ đường nét giày sneaker"
    >
      <ellipse cx="112" cy="106" rx="88" ry="7" fill="currentColor" className="text-ink/10" />
      <path
        d={def.upper}
        fill="none"
        stroke={accent}
        strokeWidth={3.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={def.sole}
        fill="none"
        stroke={accent}
        strokeWidth={3.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {def.laces.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={accent}
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.75}
        />
      ))}
      <path
        d="M14,104h192"
        stroke={accent}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.35}
      />
    </svg>
  );
}

export function silhouetteFor(index: number): Silhouette {
  const order: Silhouette[] = ["low", "high", "runner"];
  return order[index % order.length];
}
