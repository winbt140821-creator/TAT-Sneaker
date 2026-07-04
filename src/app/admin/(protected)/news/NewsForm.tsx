"use client";

import { useActionState } from "react";
import { TextField } from "@/components/admin/form/TextField";
import { TextAreaField } from "@/components/admin/form/TextAreaField";
import { ImageUploadField } from "@/components/admin/form/ImageUploadField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import type { NewsFormState } from "./actions";

const initialState: NewsFormState = {};

export function NewsForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: NewsFormState, formData: FormData) => Promise<NewsFormState>;
  defaultValues?: {
    title?: string;
    excerpt?: string;
    publishedAt?: Date;
    imageUrl?: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const dateValue = defaultValues?.publishedAt
    ? defaultValues.publishedAt.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <TextField id="title" name="title" label="Tiêu đề" required defaultValue={defaultValues?.title} />

      <TextAreaField
        id="excerpt"
        name="excerpt"
        label="Tóm tắt"
        required
        rows={3}
        defaultValue={defaultValues?.excerpt}
      />

      <TextField
        id="publishedAt"
        name="publishedAt"
        label="Ngày đăng"
        type="date"
        defaultValue={dateValue}
        className="w-48"
      />

      <ImageUploadField
        id="image"
        name="image"
        label={defaultValues?.imageUrl ? "Thay ảnh khác" : "Ảnh minh họa"}
        currentUrl={defaultValues?.imageUrl}
        previewWidth={120}
        previewHeight={90}
        previewClassName="h-[90px] w-[120px] border border-graphite object-cover"
        keepFieldName="keepImage"
      />

      <FormError message={state.error} />

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
