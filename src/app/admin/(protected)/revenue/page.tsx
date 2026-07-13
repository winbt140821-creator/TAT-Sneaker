import { AdminLink as Link } from "@/components/admin/AdminLink";
import { formatPrice } from "@/lib/products";
import {
  getRevenueTotals,
  getRevenueByBucket,
  getProfitTotal,
  getTopProducts,
  type RevenueBucket,
} from "@/lib/revenue";

const BUCKET_LABEL: Record<RevenueBucket, string> = {
  day: "Theo ngày",
  week: "Theo tuần",
  month: "Theo tháng",
  year: "Theo năm",
};

const RANGE_PRESETS = {
  "7d": { label: "7 ngày qua", days: 7 },
  "30d": { label: "30 ngày qua", days: 30 },
  "90d": { label: "90 ngày qua", days: 90 },
  "365d": { label: "12 tháng qua", days: 365 },
  all: { label: "Tất cả", days: null },
} as const;

type RangeKey = keyof typeof RANGE_PRESETS;

function isRangeKey(value: string | undefined): value is RangeKey {
  return !!value && value in RANGE_PRESETS;
}

function isBucket(value: string | undefined): value is RevenueBucket {
  return value === "day" || value === "week" || value === "month" || value === "year";
}

function isDateString(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

export default async function AdminRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ bucket?: string; range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const bucket: RevenueBucket = isBucket(params.bucket) ? params.bucket : "day";
  const rangeKey: RangeKey = isRangeKey(params.range) ? params.range : "30d";
  const hasCustomRange = isDateString(params.from) && isDateString(params.to);

  let from: Date;
  let to: Date;
  if (hasCustomRange) {
    from = new Date(`${params.from}T00:00:00`);
    to = new Date(`${params.to}T23:59:59.999`);
  } else {
    to = new Date();
    const preset = RANGE_PRESETS[rangeKey];
    from = preset.days ? new Date(to.getTime() - preset.days * 24 * 60 * 60 * 1000) : new Date(0);
  }

  // Preserves whichever range mode (preset or custom dates) is currently
  // active when only the bucket selector changes.
  const rangeQuery = hasCustomRange ? `from=${params.from}&to=${params.to}` : `range=${rangeKey}`;

  const [totals, buckets, profit, topProducts] = await Promise.all([
    getRevenueTotals(from, to),
    getRevenueByBucket(bucket, from, to),
    getProfitTotal(from, to),
    getTopProducts(from, to),
  ]);

  const cards = [
    { key: "done", label: "Hoàn tất", value: totals.done, highlight: true },
    { key: "processing", label: "Đang xử lý", value: totals.processing, highlight: false },
    { key: "pending", label: "Chờ xác nhận", value: totals.pending, highlight: false },
  ] as const;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Doanh thu</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(RANGE_PRESETS) as RangeKey[]).map((key) => (
          <Link
            key={key}
            href={`/admin/revenue?range=${key}&bucket=${bucket}`}
            className={
              "die-cut-flat cursor-pointer px-3 py-1.5 font-mono text-xs uppercase tracking-wide " +
              (!hasCustomRange && rangeKey === key
                ? "bg-ink text-paper"
                : "bg-paper text-ink hover:bg-kraft-dark/30")
            }
          >
            {RANGE_PRESETS[key].label}
          </Link>
        ))}
      </div>

      <form
        method="GET"
        action="/admin/revenue"
        className="die-cut-flat mt-3 flex flex-wrap items-end gap-3 bg-paper p-3"
      >
        <input type="hidden" name="bucket" value={bucket} />
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="font-mono text-[10px] uppercase tracking-wide text-graphite">
            Từ ngày
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={hasCustomRange ? params.from : ""}
            className="border border-graphite bg-paper px-2 py-1.5 font-mono text-xs text-ink focus:border-forest"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="font-mono text-[10px] uppercase tracking-wide text-graphite">
            Đến ngày
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={hasCustomRange ? params.to : ""}
            className="border border-graphite bg-paper px-2 py-1.5 font-mono text-xs text-ink focus:border-forest"
          />
        </div>
        <button
          type="submit"
          className="die-cut-flat cursor-pointer bg-ink px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
        >
          Xem
        </button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.key} className={`die-cut p-5 ${c.highlight ? "bg-forest" : "bg-paper"}`}>
            <p className={`font-display text-2xl ${c.highlight ? "text-paper" : "text-ink"}`}>
              {formatPrice(c.value)}
            </p>
            <p
              className={`mt-1 font-mono text-xs uppercase tracking-wide ${
                c.highlight ? "text-paper/80" : "text-graphite"
              }`}
            >
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 die-cut-flat bg-kraft p-5">
        <p className="font-display text-2xl text-ink">{formatPrice(profit)}</p>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-graphite">
          Lợi nhuận (doanh thu hoàn tất − giá nhập)
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg text-ink">Xu hướng (doanh thu hoàn tất)</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BUCKET_LABEL) as RevenueBucket[]).map((b) => (
            <Link
              key={b}
              href={`/admin/revenue?${rangeQuery}&bucket=${b}`}
              className={
                "die-cut-flat cursor-pointer px-3 py-1.5 font-mono text-xs uppercase tracking-wide " +
                (bucket === b ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-kraft-dark/30")
              }
            >
              {BUCKET_LABEL[b]}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 die-cut bg-paper p-4">
        {buckets.length === 0 ? (
          <p className="font-mono text-sm text-graphite">Không có dữ liệu trong khoảng thời gian này.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-kraft-dark text-left text-xs uppercase tracking-wide text-graphite">
                <th className="pb-2">Giai đoạn</th>
                <th className="pb-2 text-right">Số đơn</th>
                <th className="pb-2 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((row) => (
                <tr key={row.period} className="border-b border-kraft-dark/50 last:border-0">
                  <td className="py-2 text-ink">{row.period}</td>
                  <td className="py-2 text-right text-graphite">{row.orderCount}</td>
                  <td className="py-2 text-right font-semibold text-forest">{formatPrice(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <h2 className="mt-8 font-display text-lg text-ink">Sản phẩm bán chạy (đơn hoàn tất)</h2>
      <div className="mt-4 die-cut bg-paper p-4">
        {topProducts.length === 0 ? (
          <p className="font-mono text-sm text-graphite">Không có dữ liệu trong khoảng thời gian này.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-kraft-dark text-left text-xs uppercase tracking-wide text-graphite">
                <th className="pb-2">Sản phẩm</th>
                <th className="pb-2 text-right">Số lượng bán</th>
                <th className="pb-2 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((row, i) => (
                <tr key={row.productId} className="border-b border-kraft-dark/50 last:border-0">
                  <td className="py-2 text-ink">
                    <span className="mr-2 text-graphite">#{i + 1}</span>
                    {row.name}
                  </td>
                  <td className="py-2 text-right text-graphite">{row.quantity}</td>
                  <td className="py-2 text-right font-semibold text-forest">{formatPrice(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
