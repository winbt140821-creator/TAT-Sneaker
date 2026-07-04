import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { deleteStaffAction } from "./actions";
import { RowActions } from "@/components/admin/RowActions";

export default async function AdminStaffPage() {
  const current = await requireStaff();
  const staff = await prisma.staff.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Nhân viên</h1>
        <Link
          href="/admin/staff/new"
          className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          + Thêm nhân viên
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {staff.map((s) => (
          <div key={s.id} className="die-cut flex flex-wrap items-center gap-4 bg-paper p-4">
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-medium text-ink">
                {s.name}
                {s.id === current.id && (
                  <span className="ml-2 font-mono text-[10px] uppercase text-graphite">(bạn)</span>
                )}
              </p>
              <p className="font-mono text-xs text-graphite">{s.email}</p>
            </div>
            <span
              className={
                "shrink-0 px-2 py-1 font-mono text-[10px] uppercase tracking-wide " +
                (s.role === "ADMIN" ? "bg-ink text-paper" : "bg-graphite text-paper")
              }
            >
              {s.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
            </span>
            <RowActions
              editHref={`/admin/staff/${s.id}/edit`}
              deleteAction={s.id !== current.id ? deleteStaffAction.bind(null, s.id) : undefined}
              deleteConfirmMessage={`Xóa tài khoản "${s.name}"?`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
