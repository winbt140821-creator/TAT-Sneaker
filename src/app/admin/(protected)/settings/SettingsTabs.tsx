"use client";

import { AdminLink as Link } from "@/components/admin/AdminLink";
import { usePathname } from "next/navigation";

// Grouped by scope, so it's clear what changing a setting affects: the
// first group is set separately for each store (tabs inside those pages
// pick which), the second applies to both stores at once.
const GROUPS = [
  {
    label: "Riêng từng cửa hàng",
    tabs: [
      { href: "/admin/settings/logo", label: "Logo" },
      { href: "/admin/settings/trang-chu", label: "Ảnh bìa trang chủ" },
    ],
  },
  {
    label: "Dùng chung cho cả hai",
    tabs: [
      { href: "/admin/settings/lien-he", label: "Liên hệ" },
      { href: "/admin/settings/mang-xa-hoi", label: "Mạng xã hội" },
      { href: "/admin/settings/thanh-toan", label: "Thanh toán" },
      { href: "/admin/settings/quang-cao", label: "Quảng cáo" },
      { href: "/admin/settings/mo-ta-san-pham", label: "Mô tả sản phẩm" },
    ],
  },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex flex-col gap-3 border-b border-kraft-dark pb-px sm:flex-row sm:gap-8">
      {GROUPS.map((group) => (
        <div key={group.label} className="min-w-0">
          <p className="px-3 font-mono text-[10px] uppercase tracking-wider text-graphite">{group.label}</p>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {group.tabs.map((tab) => {
              const active = pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={
                    "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors " +
                    (active ? "border-forest text-ink" : "border-transparent text-graphite hover:text-ink")
                  }
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
