// Clothing department's fallback logo mark, shown until the owner uploads a
// real logo via Cài đặt > Logo: "TAT STORE" as a bare, widely tracked
// wordmark in the light Didone — the convention COS/Zara/Toteme all follow —
// rather than the shoe site's sneaker-silhouette sticker badge.
// textLength spreads the letters to exactly fill the viewBox, so the mark
// keeps its proportions even if the font hasn't loaded yet.
export function ClothingWordmark({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const color = variant === "dark" ? "#111111" : "#ffffff";
  return (
    <svg viewBox="0 0 224 28" className={className} role="img" aria-label="TAT STORE">
      <text
        x="1"
        y="24"
        className="font-display"
        fontSize="28"
        textLength="222"
        lengthAdjust="spacing"
        fill={color}
      >
        TAT STORE
      </text>
    </svg>
  );
}
