"use client";

import { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import { TextField } from "@/components/admin/form/TextField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import { SearchIcon } from "@/components/icons";
import { createSaleCampaignAction, type SaleFormState } from "./actions";

const initialState: SaleFormState = {};

type ProductOption = {
  id: string;
  sku: string;
  name: string;
  image: string | null;
  categories: { id: string; label: string }[];
};

export function SaleCampaignForm({ products }: { products: ProductOption[] }) {
  const [state, formAction] = useActionState(createSaleCampaignAction, initialState);
  const [appliesToAll, setAppliesToAll] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) for (const c of p.categories) map.set(c.id, c.label);
    return Array.from(map, ([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesCategory = !categoryId || p.categories.some((c) => c.id === categoryId);
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-4 die-cut bg-paper p-4">
      <h2 className="font-display text-lg text-ink">Tạo đợt giảm giá mới</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="name" name="name" label="Tên đợt (VD: Sale Tết 2026)" required />
        <TextField
          id="discountPercent"
          name="discountPercent"
          label="Giảm giá (%)"
          type="number"
          min={1}
          max={90}
          required
        />
      </div>

      <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
        <input
          type="checkbox"
          name="appliesToAll"
          checked={appliesToAll}
          onChange={(e) => setAppliesToAll(e.target.checked)}
        />
        Áp dụng cho toàn bộ sản phẩm
      </label>

      {!appliesToAll && (
        <fieldset>
          <legend className="font-mono text-xs uppercase tracking-wide text-graphite">
            Chọn sản phẩm áp dụng — đã chọn {selected.size}
          </legend>

          <div className="mt-2 flex flex-col gap-2 die-cut-flat bg-kraft p-3">
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mã SKU..."
                aria-label="Tìm sản phẩm"
                className="w-full border border-graphite bg-paper px-3 py-2 pr-9 text-sm text-ink focus:border-forest"
              />
              <SearchIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCategoryId(null)}
                  className={
                    "die-cut-flat cursor-pointer bg-paper px-2.5 py-1 font-mono text-[11px] transition-colors " +
                    (categoryId === null ? "border-forest text-forest" : "text-ink hover:border-forest hover:text-forest")
                  }
                >
                  Tất cả thư mục
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={
                      "die-cut-flat cursor-pointer bg-paper px-2.5 py-1 font-mono text-[11px] transition-colors " +
                      (categoryId === c.id ? "border-forest text-forest" : "text-ink hover:border-forest hover:text-forest")
                    }
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto pt-1 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((p) => {
                const checked = selected.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={
                      "die-cut-flat flex cursor-pointer flex-col gap-1.5 bg-paper p-2 transition-colors " +
                      (checked ? "border-forest bg-forest/5" : "hover:border-forest")
                    }
                  >
                    <input
                      type="checkbox"
                      name="productIds"
                      value={p.id}
                      checked={checked}
                      onChange={() => toggle(p.id)}
                      className="sr-only"
                    />
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-kraft-dark/30">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill sizes="150px" className="object-cover" />
                      ) : (
                        <span className="font-mono text-[10px] text-graphite">Ảnh</span>
                      )}
                      {checked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-forest/20">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-paper">
                            ✓
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-graphite">{p.sku}</p>
                    <p className="line-clamp-2 font-body text-xs text-ink">{p.name}</p>
                  </label>
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-full font-mono text-xs text-graphite">Không tìm thấy sản phẩm nào.</p>
              )}
            </div>
          </div>
        </fieldset>
      )}

      <FormError message={state.error} />
      <SubmitButton>Tạo đợt giảm giá</SubmitButton>
    </form>
  );
}
