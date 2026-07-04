import { createStaffAction } from "../actions";
import { StaffForm } from "../StaffForm";

export default function NewStaffPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Thêm nhân viên</h1>
      <div className="mt-6">
        <StaffForm
          action={createStaffAction}
          passwordLabel="Mật khẩu"
          passwordRequired
          submitLabel="Tạo tài khoản"
        />
      </div>
    </div>
  );
}
