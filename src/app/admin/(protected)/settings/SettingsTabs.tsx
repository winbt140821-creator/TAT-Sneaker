"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/settings/logo", label: "Logo" },
  { href: "/admin/settings/trang-chu", label: "Trang chủ" },
  { href: "/admin/settings/lien-he", label: "Liên hệ" },
  { href: "/admin/settings/mang-xa-hoi", label: "Mạng xã hội" },
  { href: "/admin/settings/thanh-toan", label: "Thanh toán" },
  { href: "/admin/settings/quang-cao", label: "Quảng cáo" },
  { href: "/admin/settings/mo-ta-san-pham", label: "Mô tả sản phẩm" },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto border-b border-kraft-dark pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors " +
              (active
                ? "border-forest text-ink"
                : "border-transparent text-graphite hover:text-ink")
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
