import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site-config";
import { HeroCarousel } from "./HeroCarousel";
import type { Department } from "@/lib/inventory";

export type HeroStat = { value: string; label: string };

// Editorial line-art emblem shown behind the clothing hero's text until admin
// uploads a real photo (coverImages) — three offset thin-stroke arcs in the
// gold accent, evoking a fashion label's abstract mark rather than a stock
// photo placeholder. Costs nothing (inline SVG, no image request) and reads
// as deliberate rather than empty, unlike the shoe site's plain bg-paper.
function ClothingHeroMotif() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -right-16 top-1/2 h-[280px] w-[280px] -translate-y-1/2 opacity-[0.14] sm:-right-10 sm:h-[420px] sm:w-[420px] lg:right-0"
    >
      <circle cx="200" cy="200" r="190" fill="none" stroke="var(--color-forest)" strokeWidth="1" />
      <circle cx="150" cy="230" r="120" fill="none" stroke="var(--color-forest)" strokeWidth="1" />
      <circle cx="250" cy="160" r="70" fill="none" stroke="var(--color-forest)" strokeWidth="1" />
    </svg>
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
  const defaultStats: HeroStat[] = [
    { value: t("statSizeValue"), label: t("statSizeLabel") },
    { value: t("statCheckValue"), label: t("statCheckLabel") },
    { value: t("statExchangeValue"), label: t("statExchangeLabel") },
  ];

  const hasCover = Boolean(coverImages && coverImages.length > 0);
  const eyebrowText = eyebrow || t("eyebrow");
  const headingLines = (heading || t("heading")).split("\n");
  const descriptionText =
    description ||
    `${site.tagline} Xem mã SKU, tình trạng và size còn hàng ngay trên từng đôi — không cần hỏi lại.`;
  const statsList = stats && stats.length > 0 ? stats : defaultStats;

  const showText = eyebrowEnabled || headingEnabled || descriptionEnabled;
  const isClothing = department === "CLOTHING";

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

        {!hasCover && isClothing && <ClothingHeroMotif />}

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
