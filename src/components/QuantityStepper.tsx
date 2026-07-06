export function QuantityStepper({
  quantity,
  onDecrease,
  onIncrease,
  increaseDisabled,
  decreaseLabel,
  increaseLabel,
  size = "sm",
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  increaseDisabled?: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  size?: "sm" | "md";
}) {
  // Sized close to the 44px touch-target minimum (Apple HIG/Material) rather
  // than the old 28-32px boxes, which were easy to miss-tap on a phone.
  // Rows using this already wrap (flex-wrap) so the extra width doesn't
  // force horizontal overflow.
  const dim = size === "md" ? "h-11 w-11" : "h-10 w-10";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={decreaseLabel}
        onClick={onDecrease}
        className={`die-cut-flat ${dim} cursor-pointer font-mono text-base text-ink hover:bg-kraft-dark/30`}
      >
        −
      </button>
      <span className="w-6 text-center font-mono text-sm text-ink">{quantity}</span>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={increaseDisabled}
        onClick={onIncrease}
        className={`die-cut-flat ${dim} cursor-pointer font-mono text-base text-ink hover:bg-kraft-dark/30 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        +
      </button>
    </div>
  );
}
