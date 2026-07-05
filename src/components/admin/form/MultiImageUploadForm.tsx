"use client";

import { useState, type ComponentProps } from "react";
import { ImageUploadFieldMulti } from "./ImageUploadFieldMulti";
import { SubmitButton } from "./SubmitButton";

// Same idea as SingleImageUploadForm but for the multi-image case (hero
// images) — guards the submit button while an upload is still in flight.
export function MultiImageUploadForm({
  action,
  formClassName = "mt-6 flex max-w-md flex-col gap-3",
  submitLabel = "Lưu thay đổi",
  ...imageProps
}: {
  action: (formData: FormData) => void | Promise<void>;
  formClassName?: string;
  submitLabel?: string;
} & ComponentProps<typeof ImageUploadFieldMulti>) {
  const [uploading, setUploading] = useState(false);

  return (
    <form action={action} className={formClassName}>
      <ImageUploadFieldMulti {...imageProps} onUploadingChange={setUploading} />
      <SubmitButton disabled={uploading}>{submitLabel}</SubmitButton>
    </form>
  );
}
