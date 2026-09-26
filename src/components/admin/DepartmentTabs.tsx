import { AdminLink as Link } from "@/components/admin/AdminLink";
import type { Department } from "@/lib/inventory";

const TABS: { value: Department; label: string }[] = [
  { value: "SHOES", label: "Giày" },
  { value: "CLOTHING", label: "Quần áo" },
];

// Switches which store a page is editing — settings kept per store (logo,
// cover, contact, social links, product description) and each store's own
// content (news, reviews, content pages, categories).
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
