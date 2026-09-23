import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site-config";
import { HeroCarousel } from "./HeroCarousel";
import type { Department } from "@/lib/inventory";

export type HeroStat = { value: string; label: string };

// The clothing site's one signature element: an ink-stamp mark echoing the
// parent brand's real differentiator (every product is SKU-tracked and
// inspected before it ships — see the shoe site's own "đã qua kiểm định 3
// bước" copy), rendered as an atelier verification stamp instead of a
// generic e-commerce trust badge. Shown watermark-faint behind the hero
// text until admin uploads a real photo (coverImages).
function InspectionStamp({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className={className}>
      <defs>
        <path id="stamp-ring" d="M 100,100 m -76,0 a 76,76 0 1,1 152,0 a 76,76 0 1,1 -152,0" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="1" />
      <text fill="currentColor" fontSize="10.5" letterSpacing="3" style={{ fontFamily: "var(--font-mono)" }}>
        <textPath href="#stamp-ring" startOffset="0%">
          TAT ATELIER · ĐÃ KIỂM ĐỊNH · TAT ATELIER · ĐÃ KIỂM ĐỊNH ·
        </textPath>
      </text>
      <path
        d="M78 101 L93 116 L124 83"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// "Ledger" stat row — a receipt-style label/dotted-leader/value line instead
// of three equal boxed columns. Reinforces the spec-sheet direction (see
// InspectionStamp above) with real structure: index, label, value.
function LedgerStats({ stats }: { stats: HeroStat[] }) {
  return (
    <dl className="relative mt-10 flex flex-col gap-3 border-t border-kraft-dark pt-6">
      {stats.map((s, i) => (
        <div key={s.label} className="flex items-baseline gap-3 font-mono text-xs">
          <dt className="flex items-baseline gap-3 text-graphite">
            <span className="text-[10px] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="uppercase tracking-[0.15em]">{s.label}</span>
          </dt>
          <span className="h-px flex-1 translate-y-[-2px] bg-[repeating-linear-gradient(to_right,var(--color-kraft-dark)_0,var(--color-kraft-dark)_2px,transparent_2px,transparent_6px)]" />
          <dd className="shrink-0 font-semibold text-ink">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export async function Hero({
  department = "SHOES",
  coverImages,
  eyebrow,
  eyebrowEnabled = true,
  heading,
  headingEnabled = true,
  description,
  descriptionEnabled = true,
  statsEnabled = true,
  stats,
}: {
  department?: Department;
  coverImages?: string[];
  eyebrow?: string | null;
  eyebrowEnabled?: boolean;
  heading?: string | null;
  headingEnabled?: boolean;
  description?: string | null;
  descriptionEnabled?: boolean;
  statsEnabled?: boolean;
  stats?: HeroStat[];
}) {
  const t = await getTranslations("hero");
  const isClothing = department === "CLOTHING";

  // The shared "hero" i18n namespace is shoe-specific copy ("Giày Sneaker",
  // "đôi" = pair — as in a pair of shoes, "đổi size" phrased for footwear).
  // Falling back to it here (as the shoe department already correctly
  // does) would print sneaker language on the clothing homepage whenever
  // admin hasn't filled in clothing branding yet — the exact "still looks
  // like the shoe site" problem this redesign is fixing. Clothing gets its
  // own hardcoded Vietnamese fallback copy instead, consistent with the
  // rest of this file's clothing-only strings (InspectionStamp, etc).
  const defaultStats: HeroStat[] = isClothing
    ? [
        { value: "500+", label: "Mẫu đang có sẵn" },
        { value: "3 bước", label: "Kiểm tra trước khi giao" },
        { value: "3 ngày", label: "Hỗ trợ đổi size" },
      ]
    : [
        { value: t("statSizeValue"), label: t("statSizeLabel") },
        { value: t("statCheckValue"), label: t("statCheckLabel") },
        { value: t("statExchangeValue"), label: t("statExchangeLabel") },
      ];

  const hasCover = Boolean(coverImages && coverImages.length > 0);
  const eyebrowText = eyebrow || (isClothing ? "Bộ sưu tập" : t("eyebrow"));
  const headingLines = (
    heading || (isClothing ? "May để mặc\nkhông phải để trưng" : t("heading"))
  ).split("\n");
  const descriptionText =
    description ||
    (isClothing
      ? "Từng chất liệu và đường may đều qua kiểm tra trước khi lên kệ — xem tình trạng và size còn hàng ngay trên từng sản phẩm, không cần hỏi lại."
      : `${site.tagline} Xem mã SKU, tình trạng và size còn hàng ngay trên từng đôi — không cần hỏi lại.`);
  const statsList = stats && stats.length > 0 ? stats : defaultStats;

  const showText = eyebrowEnabled || headingEnabled || descriptionEnabled;

  if (isClothing && !hasCover) {
    return (
      <div className="die-cut-flat relative overflow-hidden bg-paper px-4 py-14 sm:px-10 sm:py-24 lg:min-h-[520px]">
        <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div className="relative max-w-2xl">
            {eyebrowEnabled && (
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-graphite">
                {eyebrowText}
              </p>
            )}
            {headingEnabled && (
              <h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-tight text-ink sm:text-7xl lg:text-8xl">
                {headingLines.map((line, i) => {
                  const isLast = i === headingLines.length - 1;
                  return (
                    <span
                      key={i}
                      className={isLast && headingLines.length > 1 ? "italic text-forest" : ""}
                    >
                      {line}
                      {i < headingLines.length - 1 && <br />}
                    </span>
                  );
                })}
              </h1>
            )}
            {descriptionEnabled && (
              <p className="mt-6 max-w-md font-body text-sm text-graphite sm:text-base">
                {descriptionText}
              </p>
            )}
            {statsEnabled && <LedgerStats stats={statsList} />}
          </div>

          <div className="relative mx-auto hidden aspect-square w-full max-w-xs text-forest/[0.18] lg:block">
            <InspectionStamp className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        "relative h-full overflow-hidden bg-paper px-4 py-6 sm:px-10 lg:min-h-[420px] " +
        (isClothing ? "die-cut-flat sm:py-20" : "die-cut sm:py-14") +
        " " +
        (hasCover ? "aspect-[4/3] sm:aspect-auto" : "")
      }
    >
        {hasCover && (
          <>
            <HeroCarousel images={coverImages!} />
            <div className="absolute inset-0 bg-ink/60" aria-hidden="true" />
          </>
        )}

        {showText && (
          <div className="relative max-w-2xl">
            {eyebrowEnabled && (
              <p
                className={
                  "font-mono text-xs uppercase tracking-[0.25em] " +
                  (hasCover ? "text-kraft" : "text-graphite")
                }
              >
                {eyebrowText}
              </p>
            )}
            {headingEnabled && (
              <h1
                className={
                  "mt-4 font-display text-4xl leading-[1.15] tracking-tight sm:text-7xl " +
                  (hasCover ? "text-paper" : "text-ink")
                }
              >
                {headingLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < headingLines.length - 1 && <br />}
                  </span>
                ))}
              </h1>
            )}
            {descriptionEnabled && (
              <p
                className={
                  "mt-4 max-w-md font-body text-sm sm:text-base " +
                  (hasCover ? "line-clamp-2 sm:line-clamp-none text-kraft" : "text-graphite")
                }
              >
                {descriptionText}
              </p>
            )}
          </div>
        )}

        {statsEnabled && (
          <dl
            className={
              "relative grid-cols-3 gap-4 border-t pt-6 " +
              (hasCover ? "hidden sm:grid " : "grid ") +
              (showText ? "mt-10" : "mt-0") +
              " " +
              (hasCover ? "border-paper/30" : "border-kraft-dark")
            }
          >
            {statsList.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd
                  className={
                    "font-display text-2xl sm:text-3xl " +
                    (hasCover ? "text-paper" : "text-ink")
                  }
                >
                  {s.value}
                </dd>
                <dd
                  className={
                    "mt-1 font-mono text-[11px] uppercase tracking-wide " +
                    (hasCover ? "text-kraft" : "text-graphite")
                  }
                >
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        )}
    </div>
  );
}
