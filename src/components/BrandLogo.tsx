// Default vector logo: a hand-drawn stamp badge with a two-line marker-font
// wordmark ("TAT" / "SNEAKER"), a sneaker silhouette worked into the second
// line, and a small red accent — matching the reference sticker-logo style.
// Renders crisp at any size, no image upload required. Shown until an admin
// uploads a real logo file via Cài đặt > Logo.
export function BrandLogo({
  className,
  variant = "dark",
}: {
  className?: string;
  /** "dark" = black badge on light backgrounds (default). "light" = inverted white badge for dark backgrounds like the footer. */
  variant?: "dark" | "light";
}) {
  const badge = variant === "dark" ? "#111111" : "#ffffff";
  const text = variant === "dark" ? "#ffffff" : "#111111";
  const laceRed = "#dc2626";

  return (
    <svg viewBox="0 0 200 118" className={className} role="img" aria-label="TAT Sneaker">
      {/* Hand-drawn stamp/blob badge */}
      <path
        d="M32,18 C58,3 142,2 172,17 C196,29 199,68 179,89 C155,112 62,114 26,96 C1,83 3,39 32,18 Z"
        fill={badge}
      />

      <text
        x="100"
        y="52"
        textAnchor="middle"
        className="font-logo"
        fontSize="34"
        fill={text}
        transform="rotate(-3 100 52)"
      >
        TAT
      </text>

      <text x="93" y="92" textAnchor="end" className="font-logo" fontSize="21" fill={text}>
        SNE
      </text>

      {/* Sneaker silhouette standing in for a letter, matching the reference */}
      <svg x="94" y="72" width="28" height="18" viewBox="0 0 60 36">
        <path
          d="M2,29 C2,20 8,15 16,12 C22,10 27,6 33,4 C38,2 43,3 41,8 C40,11 43,12 49,11 L56,19 C59,23 57,28 50,29 L8,32 C4,32 2,31 2,29 Z"
          fill={text}
        />
        <path d="M20,15 L30,22" stroke={laceRed} strokeWidth="3" strokeLinecap="round" />
        <path d="M26,11 L36,18" stroke={laceRed} strokeWidth="3" strokeLinecap="round" />
      </svg>

      <text x="123" y="92" textAnchor="start" className="font-logo" fontSize="21" fill={text}>
        KER
      </text>
    </svg>
  );
}
