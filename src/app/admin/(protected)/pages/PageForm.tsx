"use client";

import { useActionState } from "react";
import { TextField } from "@/components/admin/form/TextField";
import { TextAreaField } from "@/components/admin/form/TextAreaField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import type { StaticPageFormState } from "./actions";

const initialState: StaticPageFormState = {};

export function PageForm({
  action,
  defaultValues,
  slugEditable = false,
  submitLabel = "Lưu thay đổi",
}: {
  action: (state: StaticPageFormState, formData: FormData) => Promise<StaticPageFormState>;
  defaultValues: { title: string; content: string; slug: string };
  slugEditable?: boolean;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      {slugEditable ? (
        <TextField
          id="slug"
          name="slug"
          label="Đường dẫn (/trang/...)"
          required
          defaultValue={defaultValues.slug}
          hint="Chỉ chữ thường, số và dấu gạch ngang, ví dụ: chinh-sach-bao-mat"
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-xs uppercase tracking-wide text-graphite">Đường dẫn</p>
          <p className="font-mono text-sm text-ink">/trang/{defaultValues.slug}</p>
        </div>
      )}

      <TextField id="title" name="title" label="Tiêu đề" required defaultValue={defaultValues.title} />

      <TextAreaField
        id="content"
        name="content"
        label="Nội dung"
        required
        rows={12}
        defaultValue={defaultValues.content}
        hint={
          'Để trống một dòng giữa các đoạn để xuống dòng ngoài trang. Dùng **chữ** để in đậm. Một đoạn mà mỗi dòng bắt đầu bằng "1. ", "2. "... sẽ hiện thành danh sách đánh số.'
        }
      />

      <FormError message={state.error} />

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
