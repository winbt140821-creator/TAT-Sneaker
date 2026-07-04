import type { InputHTMLAttributes } from "react";

export function TextField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.id} className="font-mono text-xs uppercase tracking-wide text-graphite">
        {label}
      </label>
      <input
        {...props}
        className={
          "border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest disabled:opacity-40 " +
          (className ?? "")
        }
      />
      {hint && <p className="font-mono text-[10px] text-graphite">{hint}</p>}
    </div>
  );
}
