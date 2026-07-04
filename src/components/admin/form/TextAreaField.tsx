import type { TextareaHTMLAttributes } from "react";

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.id} className="font-mono text-xs uppercase tracking-wide text-graphite">
        {label}
      </label>
      <textarea
        {...props}
        className={
          "border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest " + (className ?? "")
        }
      />
      {hint && <p className="font-mono text-[10px] text-graphite">{hint}</p>}
    </div>
  );
}
