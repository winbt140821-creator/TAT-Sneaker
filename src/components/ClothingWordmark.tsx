// Clothing department's fallback logo mark, shown in the header until the
// owner uploads a real logo via Cài đặt > Logo. BrandLogo (the shoe site's
// default) is a sticker badge with a literal sneaker silhouette worked into
// the wordmark — exactly the kind of shoe-branded chrome this storefront is
// supposed to be free of, so it gets its own plain text wordmark instead of
// inventing a finished brand identity the owner hasn't chosen yet.
export function ClothingWordmark({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const color = variant === "dark" ? "#1a1a16" : "#f4f2ec";
  return (
    <svg viewBox="0 0 160 48" className={className} role="img" aria-label="TAT">
      <text
        x="80"
        y="32"
        textAnchor="middle"
        className="font-display"
        fontSize="30"
        letterSpacing="4"
        fill={color}
      >
        TAT
      </text>
      <line x1="46" y1="40" x2="114" y2="40" stroke={color} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
