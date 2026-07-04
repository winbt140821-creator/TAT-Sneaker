"use client";

import { useActionState } from "react";
import Image from "next/image";
import { useState } from "react";
import { TextField } from "@/components/admin/form/TextField";
import { SelectField } from "@/components/admin/form/SelectField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import { ALL_SIZES } from "@/lib/inventory";
import type { ProductFormState } from "./actions";

const QUALITY_TIERS = ["Auth", "Best Quality", "Rep 11"];

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
}: {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  categories: CategoryOption[];
  defaultValues?: {
    name?: string;
    sku?: string;
    price?: number;
    costPrice?: number | null;
    quality?: string;
    accent?: string;
    sizeQuantities?: Record<string, number>;
    categoryIds?: string[];
    images?: string[];
    videoUrl?: string | null;
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
  const [images, setImages] = useState<string[]>(defaultValues?.images ?? []);
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
  const [price, setPrice] = useState(defaultValues?.price != null ? String(defaultValues.price) : "");

  function handleAvailabilityChange(next: "IN_STOCK" | "PREORDER") {
    setAvailability(next);
    setLeadTimeMin(LEAD_TIME_DEFAULTS[next].min);
    setLeadTimeMax(LEAD_TIME_DEFAULTS[next].max);
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="name" name="name" label="Tên sản phẩm" required defaultValue={defaultValues?.name} />

        <TextField
          id="sku"
          name="sku"
          label="Mã SKU (để trống sẽ tự tạo)"
          defaultValue={defaultValues?.sku}
          className="font-mono"
        />

        <TextField
          id="costPrice"
          name="costPrice"
          label="Giá nhập (đ)"
          type="number"
          min={0}
          defaultValue={defaultValues?.costPrice ?? undefined}
          hint="Nội bộ, dùng để tính lợi nhuận — khách không thấy."
        />

        <TextField
          id="price"
          name="price"
          label="Giá bán (đ)"
          type="number"
          min={0}
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="accent" className="font-mono text-xs uppercase tracking-wide text-graphite">
            Màu minh họa
          </label>
          <input
            id="accent"
            name="accent"
            type="color"
            defaultValue={defaultValues?.accent ?? "#4a4638"}
            className="h-10 w-16 cursor-pointer border border-graphite bg-paper"
          />
        </div>
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
                      onChange={(e) =>
                        setCheckedSizes((prev) =>
                          e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)
                        )
                      }
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
                    defaultValue={defaultValues?.sizeQuantities?.[s] ?? 0}
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
                    className="absolute -right-1 -top-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-stamp text-[9px] leading-none text-paper"
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
                      onChange={(e) =>
                        setCheckedSizes((prev) =>
                          e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)
                        )
                      }
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
                    defaultValue={defaultValues?.sizeQuantities?.[s] ?? 0}
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

      <fieldset>
        <legend className="font-mono text-xs uppercase tracking-wide text-graphite">Hình ảnh</legend>
        <div className="mt-2 flex flex-col gap-3">
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((url) => (
                <div key={url} className="flex flex-col items-center gap-1">
                  <Image src={url} alt="" width={72} height={72} className="h-[72px] w-[72px] border border-graphite object-cover" />
                  <label className="flex items-center gap-1 font-mono text-[10px] text-graphite">
                    <input
                      type="checkbox"
                      name="keepImages"
                      value={url}
                      defaultChecked
                      onChange={(e) => {
                        if (!e.target.checked) setImages((prev) => prev.filter((u) => u !== url));
                      }}
                    />
                    Giữ
                  </label>
                </div>
              ))}
            </div>
          )}
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            className="w-full max-w-full font-mono text-xs text-ink file:mr-3 file:cursor-pointer file:border file:border-graphite file:bg-paper file:px-3 file:py-1.5 file:font-mono file:text-xs file:uppercase"
          />
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

      <FormError message={state.error} />

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
