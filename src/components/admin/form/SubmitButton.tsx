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
  disabled,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  // Set while an ImageUploadField/ImageUploadFieldMulti upload is still in
  // flight — without this, submitting mid-upload saves the form with that
  // image missing since its URL hasn't landed in the form yet.
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={
        className ??
        "w-fit cursor-pointer bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
