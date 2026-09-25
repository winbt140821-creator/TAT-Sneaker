"use client";

import { useActionState, useEffect, useState } from "react";
import { bulkProductsAction, type BulkProductsState } from "./actions";

const FORM_ID = "bulk-products";

// The tick boxes live in the server-rendered rows (<input form="bulk-products">),
// so this bar only counts them — no client copy of the list.
function boxes() {
  return Array.from(document.querySelectorAll<HTMLInputElement>(`input[name="ids"][form="${FORM_ID}"]`));
}

const inputClass = "border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest";
const buttonClass =
  "min-h-11 cursor-pointer px-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40";

/** Change price or visibility for the ticked products, or for every product
 *  the current filter shows (`filter` is sent along so the server picks the
 *  same rows). */
export function BulkBar({ filter, totalCount }: { filter: Record<string, string>; totalCount: number }) {
  const [count, setCount] = useState(0);
  const [pageSize, setPageSize] = useState(0);
  const [scope, setScope] = useState<"selected" | "filter">("selected");
  const [mode, setMode] = useState<"set" | "add" | "percent">("set");
  const [amount, setAmount] = useState("");
  const [state, formAction, pending] = useActionState<BulkProductsState, FormData>(async (prev, formData) => {
    const result = await bulkProductsAction(prev, formData);
    // Done: clear the ticks so the next change starts from nothing.
    if (result.message) {
      boxes().forEach((b) => (b.checked = false));
      setCount(0);
      setAmount("");
    }
    return result;
  }, {});

  useEffect(() => {
    const update = () => {
      const all = boxes();
      setPageSize(all.length);
      setCount(all.filter((b) => b.checked).length);
    };
    update();
    document.addEventListener("change", update);
    return () => document.removeEventListener("change", update);
  }, []);

  const allOnPage = pageSize > 0 && count === pageSize;
  const target = scope === "filter" ? totalCount : count;

  function toggleAll() {
    const next = !allOnPage;
    boxes().forEach((b) => (b.checked = next));
    setCount(next ? pageSize : 0);
  }

  function describe(op: string) {
    if (op === "show") return "Hiện";
    if (op === "hide") return "Ẩn";
    if (mode === "set") return `Đặt giá ${amount}đ`;
    if (mode === "add") return amount.startsWith("-") ? `Giảm ${amount.slice(1)}đ` : `Tăng ${amount}đ`;
    return amount.startsWith("-") ? `Giảm ${amount.slice(1)}%` : `Tăng ${amount}%`;
  }

  return (
    <form
      id={FORM_ID}
      action={formAction}
      onSubmit={(e) => {
        const op = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value ?? "";
        if (!confirm(`${describe(op)} cho ${target} sản phẩm?`)) e.preventDefault();
      }}
      className="die-cut mt-4 flex flex-col gap-3 bg-paper p-3"
    >
      <input type="hidden" name="scope" value={scope} />
      {Object.entries(filter).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 font-mono text-xs text-ink">
          <input
            type="checkbox"
            checked={allOnPage}
            onChange={toggleAll}
            disabled={pageSize === 0}
            className="h-5 w-5 accent-ink"
          />
          Chọn cả trang
        </label>
        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-ink">
          <legend className="sr-only">Áp dụng cho</legend>
          <label className="flex min-h-11 cursor-pointer items-center gap-2">
            <input
              type="radio"
              checked={scope === "selected"}
              onChange={() => setScope("selected")}
              className="h-4 w-4 accent-ink"
            />
            {count} sản phẩm đã chọn
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2">
            <input
              type="radio"
              checked={scope === "filter"}
              onChange={() => setScope("filter")}
              className="h-4 w-4 accent-ink"
            />
            Tất cả {totalCount} sản phẩm đang lọc
          </label>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-wide text-graphite">
          Giá
          <select
            name="priceMode"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as typeof mode);
              setAmount("");
            }}
            className={`${inputClass} min-h-11 normal-case tracking-normal`}
          >
            <option value="set">Đặt giá mới</option>
            <option value="add">Tăng / giảm theo số tiền</option>
            <option value="percent">Tăng / giảm theo %</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-wide text-graphite">
          {mode === "percent" ? "Phần trăm" : "Số tiền (đ)"}
          <input
            name="amount"
            inputMode={mode === "set" ? "numeric" : "text"}
            value={amount}
            onChange={(e) => {
              const raw = e.target.value;
              if (mode === "percent") return setAmount(raw.replace(/[^\d.,-]/g, ""));
              const digits = raw.replace(/\D/g, "");
              const sign = mode === "add" && raw.trim().startsWith("-") ? "-" : "";
              setAmount(digits ? sign + Number(digits).toLocaleString("vi-VN") : sign);
            }}
            placeholder={mode === "set" ? "350.000" : mode === "add" ? "50.000 hoặc -50.000" : "10 hoặc -10"}
            className={`${inputClass} min-h-11 w-40 normal-case tracking-normal`}
          />
        </label>
        <button
          type="submit"
          name="op"
          value="price"
          disabled={pending || target === 0 || !amount.replace(/\D/g, "")}
          className={`${buttonClass} bg-ink text-paper hover:bg-ink-soft`}
        >
          Đổi giá
        </button>
        <span className="mx-1 hidden h-8 w-px bg-kraft-dark sm:block" aria-hidden />
        <button
          type="submit"
          name="op"
          value="show"
          disabled={pending || target === 0}
          className={`${buttonClass} border border-kraft-dark bg-paper text-ink hover:border-ink`}
        >
          Hiện
        </button>
        <button
          type="submit"
          name="op"
          value="hide"
          disabled={pending || target === 0}
          className={`${buttonClass} border border-kraft-dark bg-paper text-ink hover:border-ink`}
        >
          Ẩn
        </button>
      </div>
      {mode !== "set" && (
        <p className="font-mono text-[10px] text-graphite">
          Tăng/giảm chỉ áp dụng cho sản phẩm đã có giá{mode === "percent" ? ", làm tròn tới 1.000đ" : ""}.
        </p>
      )}

      <p aria-live="polite" className="font-mono text-xs">
        {pending && <span className="text-graphite">Đang cập nhật…</span>}
        {!pending && state.message && <span className="text-ink">{state.message}</span>}
        {!pending && state.error && <span className="text-stamp">{state.error}</span>}
      </p>
    </form>
  );
}
