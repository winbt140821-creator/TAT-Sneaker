import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Department } from "@/lib/department";

const STORES: { department: Department; key: "shoes" | "clothing" }[] = [
  { department: "SHOES", key: "shoes" },
  { department: "CLOTHING", key: "clothing" },
];

// The Giày | Quần áo switch above each store's header — the two stores share
// one cart, so moving between them should be one tap from anywhere. Scrolls
// away with the page; only the header below it stays pinned.
export async function StoreSwitch({ current }: { current: Department }) {
  const t = await getTranslations("storeSwitch");
  const clothing = current === "CLOTHING";
  return (
    <nav
      aria-label={t("label")}
      className={
        clothing
          ? "flex h-8 items-center gap-6 border-b border-kraft-dark bg-paper px-4 sm:px-6 lg:px-8"
          : "bg-ink text-paper"
      }
    >
      <div className={clothing ? "contents" : "mx-auto flex h-8 max-w-7xl items-center gap-5 px-4 sm:px-6"}>
        {STORES.map(({ department, key }) => {
          const active = department === current;
          return (
            <Link
              key={department}
              href="/"
              store={department}
              aria-current={active ? "page" : undefined}
              className={
                clothing
                  ? `flex h-full items-center border-b text-[11px] uppercase tracking-[0.14em] transition-colors ${
                      active ? "border-ink text-ink" : "border-transparent text-graphite hover:text-ink"
                    }`
                  : `flex h-full items-center border-b-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      active ? "border-forest text-paper" : "border-transparent text-paper/55 hover:text-paper"
                    }`
              }
            >
              {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
