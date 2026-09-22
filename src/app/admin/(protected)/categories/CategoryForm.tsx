"use client";

import { useActionState, useState } from "react";
import { TextField } from "@/components/admin/form/TextField";
import { SelectField } from "@/components/admin/form/SelectField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import { ImageUploadField } from "@/components/admin/form/ImageUploadField";
import type { Department } from "@/lib/inventory";
import type { CategoryFormState } from "./actions";

const initialState: CategoryFormState = {};

const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: "SHOES", label: "Giày" },
  { value: "CLOTHING", label: "Quần áo" },
];

export function CategoryForm({
  action,
  parents,
  defaultValues,
  submitLabel,
}: {
  action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  parents: { id: string; label: string; department: Department }[];
  defaultValues?: {
    label?: string;
    slug?: string;
    parentId?: string | null;
    department?: Department;
    hot?: boolean;
    sale?: boolean;
    sortOrder?: number;
    showcaseEnabled?: boolean;
    showcaseImageUrl?: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [imageUploading, setImageUploading] = useState(false);
  const [department, setDepartment] = useState<Department>(defaultValues?.department ?? "SHOES");

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <TextField
        id="label"
        name="label"
        label="Tên danh mục"
        required
        defaultValue={defaultValues?.label}
        placeholder="VD: Jordan, Puma, 1's..."
      />

      <TextField
        id="slug"
        name="slug"
        label="Slug (để trống sẽ tự tạo từ tên)"
        defaultValue={defaultValues?.slug}
        placeholder="vd: jordan"
        className="font-mono"
      />

      <SelectField
        id="department"
        name="department"
        label="Ngành hàng"
        value={department}
        onChange={(e) => setDepartment(e.target.value as Department)}
      >
        {DEPARTMENTS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="parentId"
        name="parentId"
        label="Danh mục cha"
        defaultValue={defaultValues?.parentId ?? ""}
      >
        <option value="">— Danh mục gốc (hiển thị trên thanh menu) —</option>
        {parents.filter((p) => p.department === department).map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </SelectField>

      <TextField
        id="sortOrder"
        name="sortOrder"
        label="Thứ tự hiển thị"
        type="number"
        defaultValue={defaultValues?.sortOrder ?? 0}
        className="w-24"
      />

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
          <input type="checkbox" name="hot" defaultChecked={defaultValues?.hot} />
          Hiển thị icon lửa (hot)
        </label>
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
          <input type="checkbox" name="sale" defaultChecked={defaultValues?.sale} />
          Kiểu giảm giá (đỏ)
        </label>
      </div>

      <fieldset className="flex flex-col gap-3 die-cut-flat bg-paper p-3">
        <legend className="font-mono text-xs uppercase tracking-wide text-graphite">
          Danh mục nổi bật (cuối trang chủ)
        </legend>
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
          <input type="checkbox" name="showcaseEnabled" defaultChecked={defaultValues?.showcaseEnabled} />
          Hiện trong khối &ldquo;Danh mục nổi bật&rdquo; ở cuối trang chủ
        </label>
        <ImageUploadField
          id="showcaseImage"
          name="showcaseImage"
          label="Ảnh đại diện danh mục"
          currentUrl={defaultValues?.showcaseImageUrl}
          currentAlt={defaultValues?.label ?? ""}
          previewWidth={160}
          previewHeight={120}
          keepFieldName="keepShowcaseImage"
          onUploadingChange={setImageUploading}
        />
      </fieldset>

      <FormError message={state.error} />

      <SubmitButton
        disabled={imageUploading}
        className="mt-2 w-fit cursor-pointer bg-ink px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
