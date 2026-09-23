// Clothing department's fallback logo mark, shown until the owner uploads a
// real logo via Cài đặt > Logo. A bare, widely tracked wordmark in the light
// Didone — the convention COS/Zara/Toteme all follow — rather than the shoe
// site's sneaker-silhouette sticker badge, and without inventing a finished
// brand identity the owner hasn't chosen yet.
export function ClothingWordmark({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const color = variant === "dark" ? "#111111" : "#ffffff";
  return (
    <svg viewBox="0 0 112 28" className={className} role="img" aria-label="TAT">
      <text
        x="0"
        y="24"
        className="font-display"
        fontSize="29"
        letterSpacing="14"
        fill={color}
      >
        TAT
      </text>
    </svg>
  );
}
