import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { signOutCustomerAction } from "@/app/[locale]/actions";

type Section = "info" | "orders" | "addresses";

const NAV: { section: Section; href: string }[] = [
  { section: "info", href: "/tai-khoan" },
  { section: "orders", href: "/tai-khoan/don-hang" },
  { section: "addresses", href: "/tai-khoan/dia-chi" },
];

export async function AccountSidebar({
  active,
  customerName,
  addressCount,
}: {
  active: Section;
  customerName: string;
  addressCount: number;
}) {
  const t = await getTranslations("account");

  return (
    <div>
      <h1 className="font-display text-xl text-ink">{t("sidebarTitle")}</h1>
      <p className="mt-1 font-body text-sm font-semibold text-ink">
        {t("greeting", { name: customerName })}
      </p>

      <nav aria-label={t("sidebarTitle")} className="mt-5 flex flex-col gap-1">
        {NAV.map(({ section, href }) => (
          <Link
            key={section}
            href={href}
            aria-current={active === section ? "page" : undefined}
            className={
              "px-1 py-1.5 font-body text-sm transition-colors " +
              (active === section
                ? "font-semibold text-forest"
                : "text-ink hover:text-forest")
            }
          >
            {section === "info" && t("navInfo")}
            {section === "orders" && t("navOrders")}
            {section === "addresses" && t("navAddresses", { count: addressCount })}
          </Link>
        ))}
        <form action={signOutCustomerAction}>
          <button
            type="submit"
            className="cursor-pointer px-1 py-1.5 text-left font-body text-sm text-ink transition-colors hover:text-stamp"
          >
            {t("logout")}
          </button>
        </form>
      </nav>
    </div>
  );
}
