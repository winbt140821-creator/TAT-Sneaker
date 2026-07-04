import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateStaffAction } from "../../actions";
import { StaffForm } from "../../StaffForm";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sửa nhân viên</h1>
      <div className="mt-6">
        <StaffForm
          action={updateStaffAction.bind(null, staff.id)}
          defaultValues={staff}
          passwordLabel="Mật khẩu mới (để trống nếu không đổi)"
          passwordRequired={false}
          submitLabel="Lưu thay đổi"
        />
      </div>
    </div>
  );
}
