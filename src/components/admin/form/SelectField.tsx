import type { ReactNode, SelectHTMLAttributes } from "react";

export function SelectField({
  label,
  children,
  className,
  ...props
}: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.id} className="font-mono text-xs uppercase tracking-wide text-graphite">
        {label}
      </label>
      <select {...props} className={"die-cut-flat bg-paper px-3 py-2 text-sm text-ink " + (className ?? "")}>
        {children}
      </select>
    </div>
  );
}
