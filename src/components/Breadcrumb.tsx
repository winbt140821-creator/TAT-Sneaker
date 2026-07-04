import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Breadcrumb({ trail }: { trail: string[] }) {
  const t = await getTranslations("common");
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto max-w-7xl px-4 py-3 font-mono text-xs text-graphite sm:px-6"
    >
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:text-ink hover:underline">
            {t("home")}
          </Link>
        </li>
        {trail.map((item) => (
          <li key={item} className="flex items-center gap-1">
            <span aria-hidden="true">»</span>
            <span className="text-ink">{item}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
