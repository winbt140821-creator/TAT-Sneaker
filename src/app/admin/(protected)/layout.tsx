import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { AdminSidebar } from "./AdminSidebar";

// Defense in depth alongside robots.ts's /admin disallow — a layout-level
// noindex covers every page under this route group in one place.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const NAV_GROUPS = [
  {
    label: "Tổng quan",
    items: [{ href: "/admin", label: "Tổng quan" }],
  },
  {
    label: "Bán hàng",
    items: [
      { href: "/admin/orders", label: "Đơn hàng" },
      { href: "/admin/customers", label: "Khách hàng" },
      { href: "/admin/revenue", label: "Doanh thu" },
    ],
  },
  {
    label: "Sản phẩm",
    items: [
      { href: "/admin/products", label: "Sản phẩm" },
      { href: "/admin/sale", label: "Sale / Khuyến mãi" },
      { href: "/admin/inventory", label: "Kho hàng" },
      { href: "/admin/categories", label: "Danh mục" },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { href: "/admin/news", label: "Tin tức" },
      { href: "/admin/testimonials", label: "Đánh giá" },
      { href: "/admin/pages", label: "Trang nội dung" },
      { href: "/admin/social", label: "Mạng xã hội" },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/admin/settings", label: "Cài đặt" },
      { href: "/admin/staff", label: "Nhân viên", adminOnly: true },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The real (DB-backed) auth check — src/proxy.ts only rejects requests
  // with no session cookie at all, cheaply and without a DB call; a
  // present-but-invalid/expired cookie reaches here, where it's actually
  // validated and sent to login if it doesn't check out.
  const [staff, settings] = await Promise.all([getCurrentStaff(), getSiteSettings()]);
  if (!staff) redirect("/admin/login");

  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || staff.role === "ADMIN"),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-dvh flex-col bg-kraft sm:flex-row">
      <AdminSidebar
        navGroups={navGroups}
        staffName={staff.name}
        staffRoleLabel={staff.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
        logoUrl={settings?.logoUrl}
      />

      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
