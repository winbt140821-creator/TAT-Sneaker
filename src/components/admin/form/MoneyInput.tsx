"use client";

import { useState } from "react";
import { groupDigits, regroupInput } from "./money-format";

/** A VND amount field shown as "3.000.000" that submits "3000000". */
export function MoneyInput({
  id,
  name,
  label,
  hint,
  defaultValue,
  disabled,
  required,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  defaultValue?: number | null;
  disabled?: boolean;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue != null ? groupDigits(String(defaultValue)) : "");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-wide text-graphite">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        disabled={disabled}
        required={required}
        onChange={(e) => setValue(regroupInput(e.target))}
        className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest disabled:opacity-40"
      />
      {hint && <p className="font-mono text-[10px] text-graphite">{hint}</p>}
      <input type="hidden" name={name} value={value.replace(/\D/g, "")} disabled={disabled} />
    </div>
  );
}
