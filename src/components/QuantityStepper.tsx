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
  const dim = size === "md" ? "h-8 w-8" : "h-7 w-7";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={decreaseLabel}
        onClick={onDecrease}
        className={`die-cut-flat ${dim} cursor-pointer font-mono text-sm text-ink hover:bg-kraft-dark/30`}
      >
        −
      </button>
      <span className="w-6 text-center font-mono text-sm text-ink">{quantity}</span>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={increaseDisabled}
        onClick={onIncrease}
        className={`die-cut-flat ${dim} cursor-pointer font-mono text-sm text-ink hover:bg-kraft-dark/30 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        +
      </button>
    </div>
  );
}
