import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ShieldCheckIcon, TagIcon, TruckIcon, UserIcon } from "./icons";

const BASE_CUSTOMER_COUNT = 1000;

export async function TrustBar() {
  const [orderCount, t] = await Promise.all([prisma.order.count(), getTranslations("trustBar")]);
  const customerCount = BASE_CUSTOMER_COUNT + orderCount;

  const items = [
    { icon: ShieldCheckIcon, title: t("checkTitle"), desc: t("checkDesc") },
    { icon: TruckIcon, title: t("shipTitle"), desc: t("shipDesc") },
    { icon: UserIcon, title: `${customerCount.toLocaleString()}+`, desc: t("customersDesc") },
    { icon: TagIcon, title: t("priceTitle"), desc: t("priceDesc") },
  ];

  return (
    <section
      id="authentic"
      className="mx-auto max-w-7xl px-4 pb-8 sm:px-6"
      aria-label={t("ariaLabel")}
    >
      <div className="die-cut grid grid-cols-2 divide-y divide-kraft-dark bg-paper text-ink sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={desc} className="flex items-center gap-3 px-4 py-4">
            <Icon className="h-6 w-6 shrink-0 text-forest" />
            <div className="min-w-0">
              <p className="font-body text-sm font-semibold leading-tight text-ink">
                {title}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wide text-graphite">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
