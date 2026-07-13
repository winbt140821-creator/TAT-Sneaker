import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { updateStaffAction } from "../../actions";
import { StaffForm } from "../../StaffForm";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // See the same check/comment in ../../page.tsx — this page had no auth
  // check of its own at all before, relying entirely on proxy.ts's
  // now-removed DB-backed role check.
  const current = await requireStaff();
  if (current.role !== "ADMIN") redirect("/admin");

  const { id } = await params;
  // select only what StaffForm's defaultValues needs — passwordHash must
  // never reach the client, and findUnique() with no `select` would ship
  // the full row (including it) into this Client Component's RSC payload.
  const staff = await prisma.staff.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
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
