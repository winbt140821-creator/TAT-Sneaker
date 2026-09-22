import { AdminLink as Link } from "@/components/admin/AdminLink";
import type { Department } from "@/lib/inventory";

const TABS: { value: Department; label: string }[] = [
  { value: "SHOES", label: "Giày" },
  { value: "CLOTHING", label: "Quần áo" },
];

// Switches which storefront a settings page is editing (currently only the
// Logo and Trang chủ/hero tabs need this — every other settings tab is one
// shared config for the whole business, see SiteSettings).
export function DepartmentTabs({
  basePath,
  department,
  className = "",
}: {
  basePath: string;
  department: Department;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={`${basePath}?department=${tab.value}`}
          className={
            "die-cut-flat px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors " +
            (department === tab.value
              ? "bg-ink text-paper"
              : "bg-paper text-graphite hover:text-ink")
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
