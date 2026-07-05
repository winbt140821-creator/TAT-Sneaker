"use client";

import { useState, type ReactNode, type ComponentProps } from "react";
import { ImageUploadField } from "./ImageUploadField";
import { SubmitButton } from "./SubmitButton";

// Wraps the common "form with just one ImageUploadField + submit button"
// pattern (logo, payment QR codes) so each settings page doesn't have to
// re-derive its own uploading state to guard the submit button.
export function SingleImageUploadForm({
  action,
  formClassName = "mt-6 flex max-w-md flex-col gap-4",
  submitLabel = "Lưu thay đổi",
  submitClassName,
  extra,
  ...imageProps
}: {
  action: (formData: FormData) => void | Promise<void>;
  formClassName?: string;
  submitLabel?: string;
  submitClassName?: string;
  extra?: ReactNode;
} & ComponentProps<typeof ImageUploadField>) {
  const [uploading, setUploading] = useState(false);

  return (
    <form action={action} className={formClassName}>
      <ImageUploadField {...imageProps} onUploadingChange={setUploading} />
      {extra}
      <SubmitButton disabled={uploading} className={submitClassName}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
