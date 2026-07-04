"use client";

import { useActionState } from "react";
import { TextField } from "@/components/admin/form/TextField";
import { SelectField } from "@/components/admin/form/SelectField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import type { StaffFormState } from "./actions";

const initialState: StaffFormState = {};

export function StaffForm({
  action,
  defaultValues,
  passwordLabel,
  passwordRequired,
  submitLabel,
}: {
  action: (state: StaffFormState, formData: FormData) => Promise<StaffFormState>;
  defaultValues?: { name?: string; email?: string; role?: string };
  passwordLabel: string;
  passwordRequired: boolean;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <TextField id="name" name="name" label="Họ tên" required defaultValue={defaultValues?.name} />

      <TextField
        id="email"
        name="email"
        label="Email đăng nhập"
        type="email"
        required
        defaultValue={defaultValues?.email}
        hint='Nếu đây là địa chỉ Gmail, nhân viên cũng có thể đăng nhập bằng nút "Đăng nhập bằng Google" ở trang đăng nhập quản trị.'
      />

      <TextField
        id="password"
        name="password"
        label={passwordLabel}
        type="password"
        required={passwordRequired}
        minLength={passwordRequired ? 6 : undefined}
      />

      <SelectField id="role" name="role" label="Vai trò" defaultValue={defaultValues?.role ?? "STAFF"}>
        <option value="STAFF">Nhân viên</option>
        <option value="ADMIN">Quản trị viên</option>
      </SelectField>

      <FormError message={state.error} />

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
