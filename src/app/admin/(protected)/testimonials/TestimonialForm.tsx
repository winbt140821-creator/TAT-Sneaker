"use client";

import { useActionState, useState } from "react";
import { TextField } from "@/components/admin/form/TextField";
import { TextAreaField } from "@/components/admin/form/TextAreaField";
import { ImageUploadField } from "@/components/admin/form/ImageUploadField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import { StoreField } from "@/components/admin/form/StoreField";
import type { Department } from "@/lib/inventory";
import type { TestimonialFormState } from "./actions";

const initialState: TestimonialFormState = {};

export function TestimonialForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: TestimonialFormState, formData: FormData) => Promise<TestimonialFormState>;
  defaultValues?: {
    quote?: string;
    authorName?: string;
    avatarUrl?: string | null;
    department?: Department;
  };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [avatarUploading, setAvatarUploading] = useState(false);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <StoreField
        label="Hiện ở trang chủ cửa hàng"
        defaultValue={defaultValues?.department ?? "SHOES"}
        className="w-48"
      />

      <TextAreaField
        id="quote"
        name="quote"
        label="Nội dung đánh giá"
        required
        rows={4}
        defaultValue={defaultValues?.quote}
      />

      <TextField
        id="authorName"
        name="authorName"
        label="Tên khách hàng"
        required
        defaultValue={defaultValues?.authorName}
      />

      <ImageUploadField
        id="avatar"
        name="avatar"
        label={defaultValues?.avatarUrl ? "Thay ảnh đại diện khác" : "Ảnh đại diện (không bắt buộc)"}
        currentUrl={defaultValues?.avatarUrl}
        previewWidth={56}
        previewHeight={56}
        previewClassName="h-14 w-14 rounded-full border border-graphite object-cover"
        keepFieldName="keepAvatar"
        onUploadingChange={setAvatarUploading}
      />

      <FormError message={state.error} />

      <SubmitButton disabled={avatarUploading}>{submitLabel}</SubmitButton>
    </form>
  );
}
