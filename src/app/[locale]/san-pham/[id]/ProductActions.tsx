"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { addToCart } from "@/lib/cart-storage";
import {
  getCarriedSizes,
  getQuantityForSize,
  hasRealStockForSize,
  IN_STOCK_LEAD_TIME,
  type Department,
} from "@/lib/inventory";
import { trackAddToCart } from "@/lib/meta-pixel";
import { BagIcon } from "@/components/icons";
import { QuantityStepper } from "@/components/QuantityStepper";
import { WishlistButton } from "./WishlistButton";
import { ShareButton } from "./ShareButton";

export function ProductActions({
  productId,
  productName,
  price,
  sizeQuantities,
  availability,
  leadTimeMinDays,
  leadTimeMaxDays,
  department,
}: {
  productId: string;
  productName: string;
  price: number;
  sizeQuantities: Record<string, number>;
  availability: "IN_STOCK" | "PREORDER";
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
  department: Department;
}) {
  const router = useRouter();
  const t = useTranslations("productActions");
  const tDetail = useTranslations("productDetail");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );

  const availableQty = selectedSize != null ? getQuantityForSize(sizeQuantities, selectedSize) : null;
  const carriedSizes = getCarriedSizes(sizeQuantities, department);
  // Preorder items keep every size orderable regardless of real stock (see
  // hasRealStockForSize) — only an IN_STOCK product's size can be truly sold
  // out (quantity 0).
  const selectedSizeHasRealStock = availableQty != null && hasRealStockForSize(availableQty);

  function pickSize(size: string) {
    setSelectedSize(size);
    setQuantity(1);
    setFeedback(null);
  }

  function requireSize() {
    if (selectedSize == null) {
      setFeedback({ type: "error", text: t("chooseSizeFirst") });
      return false;
    }
    return true;
  }

  function handleAddToCart() {
    if (!requireSize() || selectedSize == null) return;
    addToCart(productId, selectedSize, quantity);
    trackAddToCart({ id: productId, name: productName, price, quantity });
    const suffix = quantity > 1 ? ` (+${quantity})` : "";
    setFeedback({ type: "success", text: t("addedToCart", { size: selectedSize }) + suffix });
  }

  function handleBuyNow() {
    if (!requireSize() || selectedSize == null) return;
    addToCart(productId, selectedSize, quantity);
    trackAddToCart({ id: productId, name: productName, price, quantity });
    router.push("/thanh-toan");
  }

  if (department === "CLOTHING") {
    // Purchase block as COS/Zara lay it out: wide square size boxes, one
    // full-width black "add to bag" as the primary action, the secondary
    // one outlined underneath — no side-by-side button cluster.
    return (
      <div className="mt-8 flex flex-col gap-6">
        <fieldset>
          <legend className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink">{t("chooseSize")}</legend>
          <ul className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-5" aria-label={t("chooseSize")}>
            {carriedSizes.map((s) => {
              const disabled = availability === "IN_STOCK" && getQuantityForSize(sizeQuantities, s) <= 0;
              const isSelected = selectedSize === s;
              return (
                <li key={s}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => pickSize(s)}
                    aria-pressed={isSelected}
                    className={
                      "flex h-11 w-full items-center justify-center border text-[13px] transition-colors " +
                      (disabled
                        ? "cursor-not-allowed border-kraft-dark text-graphite/50 line-through"
                        : isSelected
                          ? "cursor-pointer border-ink bg-ink text-paper"
                          : "cursor-pointer border-kraft-dark text-ink hover:border-ink")
                    }
                  >
                    {s}
                  </button>
                </li>
              );
            })}
          </ul>
          {availableQty != null && (
            <p className="mt-3 text-[12px] text-graphite">
              {availability === "PREORDER"
                ? selectedSizeHasRealStock
                  ? `${tDetail("inStock")} — ${tDetail("leadTime", IN_STOCK_LEAD_TIME)}`
                  : `${tDetail("preorder")} — ${tDetail("leadTime", { min: leadTimeMinDays, max: leadTimeMaxDays })}`
                : t("stockLeftGeneric", { count: availableQty })}
            </p>
          )}
        </fieldset>

        <div className="flex items-center gap-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink">{t("quantity")}</p>
          <QuantityStepper
            size="md"
            quantity={quantity}
            decreaseLabel={t("decreaseQty")}
            increaseLabel={t("increaseQty")}
            onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
            increaseDisabled={availableQty != null && quantity >= availableQty}
            onIncrease={() => setQuantity((q) => (availableQty != null ? Math.min(availableQty, q + 1) : q + 1))}
          />
        </div>

        {feedback && (
          <p
            role={feedback.type === "error" ? "alert" : "status"}
            className={`text-[12px] ${feedback.type === "error" ? "text-stamp" : "text-ink"}`}
          >
            {feedback.text}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex h-12 w-full cursor-pointer items-center justify-center bg-ink text-[12px] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ink-soft"
          >
            {t("addToCart")}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex h-12 w-full cursor-pointer items-center justify-center border border-ink bg-paper text-[12px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-kraft"
          >
            {t("buyNow")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <WishlistButton productId={productId} />
          <ShareButton productName={productName} />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <fieldset>
        <legend className="font-mono text-xs uppercase tracking-wide text-graphite">{t("size")}</legend>
        <ul className="mt-2 flex flex-wrap gap-2" aria-label={t("chooseSize")}>
          {carriedSizes.map((s) => {
            // Preorder sizes are always orderable regardless of real stock —
            // only an IN_STOCK product's size can be truly sold out.
            const disabled = availability === "IN_STOCK" && getQuantityForSize(sizeQuantities, s) <= 0;
            const isSelected = selectedSize === s;
            return (
              <li key={s}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => pickSize(s)}
                  aria-pressed={isSelected}
                  className={
                    "flex h-10 w-10 items-center justify-center border font-mono text-sm transition-colors " +
                    (disabled
                      ? "cursor-not-allowed border-kraft-dark text-graphite/40 line-through"
                      : isSelected
                        ? "cursor-pointer border-forest bg-forest text-paper"
                        : "cursor-pointer border-kraft-dark text-ink hover:border-forest")
                  }
                >
                  {s}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="flex items-center gap-3">
        <p className="font-mono text-xs uppercase tracking-wide text-graphite">{t("quantity")}</p>
        <QuantityStepper
          size="md"
          quantity={quantity}
          decreaseLabel={t("decreaseQty")}
          increaseLabel={t("increaseQty")}
          onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
          increaseDisabled={availableQty != null && quantity >= availableQty}
          onIncrease={() => setQuantity((q) => (availableQty != null ? Math.min(availableQty, q + 1) : q + 1))}
        />
        {availableQty != null &&
          (availability === "PREORDER" ? (
            <p className="font-mono text-xs text-graphite">
              {selectedSizeHasRealStock
                ? `${tDetail("inStock")} — ${tDetail("leadTime", IN_STOCK_LEAD_TIME)}`
                : `${tDetail("preorder")} — ${tDetail("leadTime", { min: leadTimeMinDays, max: leadTimeMaxDays })}`}
            </p>
          ) : (
            <p className="font-mono text-xs text-graphite">{t("stockLeft", { count: availableQty })}</p>
          ))}
      </div>

      {feedback && (
        <p
          role={feedback.type === "error" ? "alert" : "status"}
          className={`font-mono text-xs ${feedback.type === "error" ? "text-stamp" : "text-green-600"}`}
        >
          {feedback.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleBuyNow}
          className="die-cut-flat flex-1 cursor-pointer bg-forest px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-forest-dark sm:flex-none"
        >
          {t("buyNow")}
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          className="die-cut-flat flex flex-1 cursor-pointer items-center justify-center gap-2 bg-ink px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft sm:flex-none"
        >
          <BagIcon className="h-4 w-4" />
          {t("addToCart")}
        </button>
        <WishlistButton productId={productId} />
        <ShareButton productName={productName} />
      </div>
    </div>
  );
}
