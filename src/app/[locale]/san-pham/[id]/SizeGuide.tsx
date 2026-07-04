import { useTranslations } from "next-intl";
import { ChevronDownIcon, RulerIcon } from "@/components/icons";
import type { SizeChartEntry } from "@/lib/size-chart";

export function SizeGuide({ rows }: { rows: SizeChartEntry[] }) {
  const t = useTranslations("productDetail");
  if (rows.length === 0) return null;

  return (
    <details className="die-cut-flat group mt-4 bg-paper p-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-mono text-xs uppercase tracking-wide text-ink">
        <RulerIcon className="h-4 w-4 text-forest" />
        {t("sizeGuideTitle")}
        <ChevronDownIcon className="ml-auto h-3.5 w-3.5 text-graphite transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-kraft-dark text-graphite">
              <th className="py-1.5 text-left font-semibold">VN</th>
              <th className="py-1.5 text-left font-semibold">US</th>
              <th className="py-1.5 text-left font-semibold">UK</th>
              <th className="py-1.5 text-left font-semibold">CM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-kraft-dark/50 text-ink">
                <td className="py-1.5">{row.vn}</td>
                <td className="py-1.5">{row.us}</td>
                <td className="py-1.5">{row.uk}</td>
                <td className="py-1.5">{row.cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-mono text-[10px] text-graphite">
        {t("sizeGuideDisclaimer")}
      </p>
    </details>
  );
}
