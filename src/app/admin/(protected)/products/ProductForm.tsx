"use client";

import { useActionState } from "react";
import { useState } from "react";
import { TextField } from "@/components/admin/form/TextField";
import { TextAreaField } from "@/components/admin/form/TextAreaField";
import { SelectField } from "@/components/admin/form/SelectField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import { ImageUploadFieldMulti } from "@/components/admin/form/ImageUploadFieldMulti";
import { PriceInputWithCurrency } from "@/components/admin/form/PriceInputWithCurrency";
import { ALL_SIZES } from "@/lib/inventory";
import type { ProductFormState } from "./actions";

const QUALITY_TIERS = ["Auth", "Best Quality", "Like Auth", "Rep 11"];

const LEAD_TIME_DEFAULTS = {
  IN_STOCK: { min: 3, max: 5 },
  PREORDER: { min: 10, max: 15 },
} as const;

const initialState: ProductFormState = {};

type CategoryOption = {
  id: string;
  label: string;
  children: { id: string; label: string }[];
};

export function ProductForm({
  action,
  categories,
  defaultValues,
  submitLabel,
  usdExchangeRate,
  cnyExchangeRate,
}: {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  categories: CategoryOption[];
  usdExchangeRate?: number | null;
  cnyExchangeRate?: number | null;
  defaultValues?: {
    name?: string;
    sku?: string;
    price?: number;
    costPrice?: number | null;
    shippingFee?: number;
    quality?: string;
    sizeQuantities?: Record<string, number>;
    categoryIds?: string[];
    images?: string[];
    videoUrl?: string | null;
    description?: string | null;
    availability?: "IN_STOCK" | "PREORDER";
    leadTimeMinDays?: number;
    leadTimeMaxDays?: number;
    depositRequired?: boolean;
    depositAmount?: number | null;
  };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [checkedSizes, setCheckedSizes] = useState<number[]>(
    defaultValues?.sizeQuantities ? Object.keys(defaultValues.sizeQuantities).map(Number) : []
  );
  const [customSizes, setCustomSizes] = useState<number[]>(() => {
    const existing = defaultValues?.sizeQuantities
      ? Object.keys(defaultValues.sizeQuantities).map(Number)
      : [];
    return existing.filter((s) => !ALL_SIZES.includes(s)).sort((a, b) => a - b);
  });
  const [newSize, setNewSize] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>(
    defaultValues?.sizeQuantities ?? {}
  );
  const [bulkQty, setBulkQty] = useState("");
  const [imagesUploading, setImagesUploading] = useState(false);

  const shippingFeeDefault = defaultValues?.shippingFee ?? 0;
  const baseCostDefault =
    defaultValues?.costPrice != null ? defaultValues.costPrice - shippingFeeDefault : undefined;

  function handleApplyBulkQty() {
    const n = Math.floor(Number(bulkQty));
    if (bulkQty === "" || Number.isNaN(n) || n < 0 || checkedSizes.length === 0) return;
    setQuantities((prev) => {
      const next = { ...prev };
      for (const s of checkedSizes) next[s] = n;
      return next;
    });
  }

  function handleAddCustomSize() {
    const n = Math.floor(Number(newSize));
    if (!newSize || Number.isNaN(n) || n <= 0) return;
    setNewSize("");
    if (ALL_SIZES.includes(n)) {
      setCheckedSizes((prev) => (prev.includes(n) ? prev : [...prev, n]));
      return;
    }
    setCheckedSizes((prev) => (prev.includes(n) ? prev : [...prev, n]));
    setCustomSizes((prev) => (prev.includes(n) ? prev : [...prev, n].sort((a, b) => a - b)));
  }

  function handleRemoveCustomSize(s: number) {
    setCustomSizes((prev) => prev.filter((x) => x !== s));
    setCheckedSizes((prev) => prev.filter((x) => x !== s));
  }
  const [availability, setAvailability] = useState<"IN_STOCK" | "PREORDER">(
    defaultValues?.availability ?? "IN_STOCK"
  );
  const [leadTimeMin, setLeadTimeMin] = useState(
    defaultValues?.leadTimeMinDays ?? LEAD_TIME_DEFAULTS.IN_STOCK.min
  );
  const [leadTimeMax, setLeadTimeMax] = useState(
    defaultValues?.leadTimeMaxDays ?? LEAD_TIME_DEFAULTS.IN_STOCK.max
  );
  const [depositRequired, setDepositRequired] = useState(defaultValues?.depositRequired ?? false);

  function handleAvailabilityChange(next: "IN_STOCK" | "PREORDER") {
    setAvailability(next);
    setLeadTimeMin(LEAD_TIME_DEFAULTS[next].min);
    setLeadTimeMax(LEAD_TIME_DEFAULTS[next].max);

    // Đặt trước (order): admin thường không biết trước tồn kho chính xác, nên
    // những size đã tích mà chưa nhập số lượng (vẫn 0) sẽ tự set 100 — coi
    // như đủ hàng để nhận đơn, khỏi phải tự gõ tay từng size.
    if (next === "PREORDER") {
      setQuantities((prev) => {
        const updated = { ...prev };
        for (const s of checkedSizes) if (!updated[s]) updated[s] = 100;
        return updated;
      });
    }
  }

  function handleSizeCheck(s: number, checked: boolean) {
    setCheckedSizes((prev) => (checked ? [...prev, s] : prev.filter((x) => x !== s)));
    if (checked) {
      setQuantities((prev) => (prev[s] ? prev : { ...prev, [s]: availability === "PREORDER" ? 100 : 0 }));
    }
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <ImageUploadFieldMulti
        name="images"
        label="Hình ảnh"
        initialImages={defaultValues?.images ?? []}
        onUploadingChange={setImagesUploading}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="name" name="name" label="Tên sản phẩm" required defaultValue={defaultValues?.name} />

        <TextField
          id="sku"
          name="sku"
          label="Mã SKU (để trống sẽ tự tạo)"
          defaultValue={defaultValues?.sku}
          className="font-mono"
        />

        <PriceInputWithCurrency
          id="baseCostPrice"
          name="baseCostPrice"
          label="Giá gốc"
          defaultValueVnd={baseCostDefault}
          usdExchangeRate={usdExchangeRate}
          cnyExchangeRate={cnyExchangeRate}
          hint="Nội bộ, dùng để tính lợi nhuận — khách không thấy."
        />

        <TextField
          id="shippingFee"
          name="shippingFee"
          label="Phí ship (đ)"
          type="number"
          min={0}
          defaultValue={shippingFeeDefault}
          hint="Giá nhập = Giá gốc + Phí ship."
        />

        <PriceInputWithCurrency
          id="price"
          name="price"
          label="Giá bán"
          required
          defaultValueVnd={defaultValues?.price}
          usdExchangeRate={usdExchangeRate}
          cnyExchangeRate={cnyExchangeRate}
          hint="Giảm giá theo dịp lễ được quản lý ở trang Sale/Khuyến mãi, không nhập ở đây."
        />

        <SelectField
          id="quality"
          name="quality"
          label="Chất lượng"
          defaultValue={defaultValues?.quality ?? "Auth"}
        >
          {QUALITY_TIERS.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </SelectField>
      </div>

      <fieldset>
        <legend className="font-mono text-xs uppercase tracking-wide text-graphite">
          Nguồn hàng &amp; thời gian giao
        </legend>
        <div className="mt-2 flex flex-col gap-3 die-cut-flat bg-paper p-3">
          <SelectField
            id="availability"
            name="availability"
            label="Loại hàng"
            value={availability}
            onChange={(e) => handleAvailabilityChange(e.target.value as "IN_STOCK" | "PREORDER")}
          >
            <option value="IN_STOCK">Có sẵn</option>
            <option value="PREORDER">Đặt trước (order)</option>
          </SelectField>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="leadTimeMinDays"
              name="leadTimeMinDays"
              label="Giao từ (ngày)"
              type="number"
              min={0}
              required
              value={leadTimeMin}
              onChange={(e) => setLeadTimeMin(Number(e.target.value))}
            />
            <TextField
              id="leadTimeMaxDays"
              name="leadTimeMaxDays"
              label="Giao đến (ngày)"
              type="number"
              min={0}
              required
              value={leadTimeMax}
              onChange={(e) => setLeadTimeMax(Number(e.target.value))}
            />
          </div>
          <p className="font-mono text-[11px] text-graphite">
            Mặc định: có sẵn 3-5 ngày, đặt trước 10-15 ngày. Có thể chỉnh lại theo từng sản phẩm.
          </p>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-mono text-xs uppercase tracking-wide text-graphite">Đặt cọc</legend>
        <div className="mt-2 flex flex-col gap-3 die-cut-flat bg-paper p-3">
          <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
            <input
              type="checkbox"
              name="depositRequired"
              checked={depositRequired}
              onChange={(e) => setDepositRequired(e.target.checked)}
            />
            Yêu cầu đặt cọc trước khi giao
          </label>
          <TextField
            id="depositAmount"
            name="depositAmount"
            label="Số tiền cọc (đ)"
            type="number"
            min={0}
            disabled={!depositRequired}
            defaultValue={defaultValues?.depositAmount ?? undefined}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-mono text-xs uppercase tracking-wide text-graphite">Danh mục</legend>
        <div className="mt-2 flex flex-col gap-2 die-cut-flat bg-paper p-3">
          {categories.map((top) => (
            <div key={top.id}>
              <label className="flex items-center gap-2.5 py-1.5 font-body text-sm text-ink">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={top.id}
                  defaultChecked={defaultValues?.categoryIds?.includes(top.id)}
                  className="h-4 w-4 shrink-0"
                />
                {top.label}
              </label>
              {top.children.map((child) => (
                <label key={child.id} className="ml-6 flex items-center gap-2.5 py-1.5 font-body text-sm text-graphite">
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={child.id}
                    defaultChecked={defaultValues?.categoryIds?.includes(child.id)}
                    className="h-4 w-4 shrink-0"
                  />
                  {child.label}
                </label>
              ))}
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-mono text-xs uppercase tracking-wide text-graphite">Size &amp; số lượng</legend>
        <div className="mt-2 die-cut-flat bg-paper p-3">
          <p className="font-mono text-[11px] text-graphite">
            Tích size sản phẩm có, sau đó nhập số lượng đôi đang có cho size đó (0 = hết hàng).
          </p>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={1}
              value={bulkQty}
              onChange={(e) => setBulkQty(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyBulkQty();
                }
              }}
              placeholder="Số lượng chung"
              aria-label="Số lượng áp dụng cho tất cả size đã chọn"
              className="w-32 border border-graphite bg-paper px-2 py-1.5 text-sm text-ink focus:border-forest"
            />
            <button
              type="button"
              onClick={handleApplyBulkQty}
              className="cursor-pointer bg-ink px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-ink-soft"
            >
              Áp dụng cho size đã chọn
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {ALL_SIZES.map((s) => {
              const carried = checkedSizes.includes(s);
              return (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <label
                    className={
                      "flex h-11 w-11 cursor-pointer items-center justify-center border font-mono text-sm font-semibold transition-colors " +
                      (carried
                        ? "border-forest bg-forest/10 text-forest"
                        : "border-graphite text-ink hover:border-forest")
                    }
                  >
                    <input
                      type="checkbox"
                      name="carriedSizes"
                      value={s}
                      checked={carried}
                      onChange={(e) => handleSizeCheck(s, e.target.checked)}
                      className="sr-only"
                    />
                    {s}
                  </label>
                  <input
                    type="number"
                    name={`qty_${s}`}
                    min={0}
                    step={1}
                    disabled={!carried}
                    value={quantities[s] ?? 0}
                    onChange={(e) =>
                      setQuantities((prev) => ({ ...prev, [s]: Number(e.target.value) }))
                    }
                    aria-label={`Số lượng size ${s}`}
                    className="w-14 border border-graphite bg-paper px-1.5 py-1 text-center font-mono text-xs text-ink focus:border-forest disabled:opacity-30"
                  />
                </div>
              );
            })}
            {customSizes.map((s) => {
              const carried = checkedSizes.includes(s);
              return (
                <div key={s} className="relative flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomSize(s)}
                    aria-label={`Xóa size ${s}`}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-stamp text-[10px] leading-none text-paper"
                  >
                    ×
                  </button>
                  <label
                    className={
                      "flex h-11 w-11 cursor-pointer items-center justify-center border font-mono text-sm font-semibold transition-colors " +
                      (carried
                        ? "border-forest bg-forest/10 text-forest"
                        : "border-graphite text-ink hover:border-forest")
                    }
                  >
                    <input
                      type="checkbox"
                      name="carriedSizes"
                      value={s}
                      checked={carried}
                      onChange={(e) => handleSizeCheck(s, e.target.checked)}
                      className="sr-only"
                    />
                    {s}
                  </label>
                  <input
                    type="number"
                    name={`qty_${s}`}
                    min={0}
                    step={1}
                    disabled={!carried}
                    value={quantities[s] ?? 0}
                    onChange={(e) =>
                      setQuantities((prev) => ({ ...prev, [s]: Number(e.target.value) }))
                    }
                    aria-label={`Số lượng size ${s}`}
                    className="w-14 border border-graphite bg-paper px-1.5 py-1 text-center font-mono text-xs text-ink focus:border-forest disabled:opacity-30"
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomSize();
                }
              }}
              placeholder="Size khác (VD: 46)"
              aria-label="Nhập size khác"
              className="w-36 border border-graphite bg-paper px-2 py-1.5 text-sm text-ink focus:border-forest"
            />
            <button
              type="button"
              onClick={handleAddCustomSize}
              className="cursor-pointer bg-ink px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-ink-soft"
            >
              + Thêm size
            </button>
          </div>
        </div>
      </fieldset>

      <TextField
        id="videoUrl"
        name="videoUrl"
        label="Video YouTube (để trống nếu không có)"
        type="url"
        placeholder="https://www.youtube.com/watch?v=..."
        defaultValue={defaultValues?.videoUrl ?? ""}
      />

      <TextAreaField
        id="description"
        name="description"
        label="Mô tả riêng cho sản phẩm này (để trống sẽ dùng mô tả chung)"
        rows={6}
        defaultValue={defaultValues?.description ?? ""}
        hint="Chỉnh mô tả chung cho tất cả sản phẩm ở Cài đặt > Mô tả sản phẩm."
      />

      <FormError message={state.error} />

      <SubmitButton disabled={imagesUploading}>{submitLabel}</SubmitButton>
    </form>
  );
}
