"use client";

import { useActionState, useState } from "react";
import { TextField } from "@/components/admin/form/TextField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import { createSaleCampaignAction, type SaleFormState } from "./actions";

const initialState: SaleFormState = {};

export function SaleCampaignForm({
  products,
}: {
  products: { id: string; sku: string; name: string }[];
}) {
  const [state, formAction] = useActionState(createSaleCampaignAction, initialState);
  const [appliesToAll, setAppliesToAll] = useState(true);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4 die-cut bg-paper p-4">
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
            Chọn sản phẩm áp dụng
          </legend>
          <div className="mt-2 max-h-64 overflow-y-auto die-cut-flat bg-kraft p-3">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 py-1.5 font-body text-sm text-ink">
                <input type="checkbox" name="productIds" value={p.id} className="h-4 w-4 shrink-0" />
                <span className="font-mono text-xs text-graphite">{p.sku}</span> {p.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <FormError message={state.error} />
      <SubmitButton>Tạo đợt giảm giá</SubmitButton>
    </form>
  );
}
