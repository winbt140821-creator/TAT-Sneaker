import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site-config";

export type HeroStat = { value: string; label: string };

export async function Hero({
  coverImageUrl,
  eyebrow,
  eyebrowEnabled = true,
  heading,
  headingEnabled = true,
  description,
  descriptionEnabled = true,
  statsEnabled = true,
  stats,
}: {
  coverImageUrl?: string | null;
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

  const hasCover = Boolean(coverImageUrl);
  const eyebrowText = eyebrow || t("eyebrow");
  const headingLines = (heading || t("heading")).split("\n");
  const descriptionText =
    description ||
    `${site.tagline} Xem mã SKU, tình trạng và size còn hàng ngay trên từng đôi — không cần hỏi lại.`;
  const statsList = stats && stats.length > 0 ? stats : defaultStats;

  const showText = eyebrowEnabled || headingEnabled || descriptionEnabled;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-2 sm:px-6">
      <div className="die-cut relative overflow-hidden bg-paper px-6 py-10 sm:px-10 sm:py-14">
        {hasCover && (
          <>
            <Image
              src={coverImageUrl!}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
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
                  (hasCover ? "text-kraft" : "text-graphite")
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
              "relative grid grid-cols-3 gap-4 border-t pt-6 " +
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
    </section>
  );
}
