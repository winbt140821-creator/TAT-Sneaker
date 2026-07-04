import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { AdminSidebar } from "./AdminSidebar";

// Defense in depth alongside robots.ts's /admin disallow — a layout-level
// noindex covers every page under this route group in one place.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/customers", label: "Khách hàng" },
  { href: "/admin/revenue", label: "Doanh thu" },
  { href: "/admin/products", label: "Sản phẩm" },
  { href: "/admin/inventory", label: "Kho hàng" },
  { href: "/admin/categories", label: "Danh mục" },
  { href: "/admin/news", label: "Tin tức" },
  { href: "/admin/testimonials", label: "Đánh giá" },
  { href: "/admin/pages", label: "Trang nội dung" },
  { href: "/admin/settings", label: "Cài đặt" },
  { href: "/admin/staff", label: "Nhân viên", adminOnly: true },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth — src/proxy.ts already redirects unauthenticated
  // requests, but Server Functions must never rely on that alone.
  const [staff, settings] = await Promise.all([requireStaff(), getSiteSettings()]);

  return (
    <div className="flex min-h-dvh flex-col bg-kraft sm:flex-row">
      <AdminSidebar
        nav={NAV.filter((item) => !item.adminOnly || staff.role === "ADMIN")}
        staffName={staff.name}
        staffRoleLabel={staff.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
        logoUrl={settings?.logoUrl}
      />

      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
