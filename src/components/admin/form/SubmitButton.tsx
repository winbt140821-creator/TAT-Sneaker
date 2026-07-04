"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Reads pending state from the nearest <form> via useFormStatus, so it works
// both in forms driven by useActionState (ProductForm etc.) and plain server
// action forms (Settings) without each form re-deriving pending itself.
export function SubmitButton({
  children,
  pendingLabel = "Đang lưu...",
  className,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "w-fit cursor-pointer bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
