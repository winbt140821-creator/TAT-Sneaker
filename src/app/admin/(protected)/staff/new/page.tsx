import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createStaffAction } from "../actions";
import { StaffForm } from "../StaffForm";

export default async function NewStaffPage() {
  // See the same check/comment in ../page.tsx — this page had no auth check
  // of its own at all before, relying entirely on proxy.ts's now-removed
  // DB-backed role check.
  const staff = await requireStaff();
  if (staff.role !== "ADMIN") redirect("/admin");

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
