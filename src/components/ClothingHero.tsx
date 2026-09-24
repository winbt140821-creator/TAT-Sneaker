import { CoverImage } from "./CoverImage";
import { Link } from "@/i18n/navigation";

// The clothing homepage's opening — built from how COS and Zara actually
// open: photography edge to edge at (nearly) full viewport height, no card,
// no border, no stats, and only a line or two of type set over the image.
// Two uploaded hero images sit side by side as a diptych on desktop (a
// common way luxury sites use portrait campaign shots on a wide screen);
// mobile shows the first one full-bleed. Images come from admin (Cài đặt >
// Trang chủ), so the owner swaps the campaign without a deploy.
export function ClothingHero({
  images,
  eyebrow,
  heading,
  ctaLabel = "Khám phá bộ sưu tập",
  ctaHref = "/?sort=newest",
}: {
  images: string[];
  eyebrow?: string | null;
  heading?: string | null;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const headingLines = (heading ?? "").split("\n").filter(Boolean);
  const [first, second] = images;

  // No campaign images uploaded yet — still full-width and borderless, set
  // purely in type on white, so the page never falls back to a boxed card.
  if (!first) {
    return (
      <section className="flex min-h-[60svh] flex-col items-center justify-center border-b border-kraft-dark px-6 py-24 text-center">
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-graphite">{eyebrow}</p>
        )}
        {headingLines.length > 0 && (
          <h1 className="mt-6 font-display text-5xl leading-[1.05] text-ink sm:text-7xl lg:text-8xl">
            {headingLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>
        )}
        <Link
          href={ctaHref}
          className="mt-10 border-b border-ink pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-opacity hover:opacity-60"
        >
          {ctaLabel}
        </Link>
      </section>
    );
  }

  return (
    <section className="relative h-[calc(100svh-3.5rem)] min-h-[520px] w-full overflow-hidden bg-kraft lg:h-[calc(100svh-60px)]">
      <div className={"grid h-full " + (second ? "lg:grid-cols-2" : "")}>
        <div className="relative h-full">
          <CoverImage src={first} priority sizes={second ? "(min-width: 1024px) 50vw, 100vw" : "100vw"} />
        </div>
        {second && (
          <div className="relative hidden h-full lg:block">
            {/* Desktop only, and lazy: hidden on phones, so phones never download it. */}
            <CoverImage src={second} sizes="50vw" />
          </div>
        )}
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-5 pb-10 text-white sm:px-8 sm:pb-14 lg:px-12 lg:pb-16">
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/85">{eyebrow}</p>
        )}
        {headingLines.length > 0 && (
          <h1 className="mt-4 max-w-3xl font-display text-[44px] leading-[1.02] sm:text-7xl lg:text-[88px]">
            {headingLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>
        )}
        <Link
          href={ctaHref}
          className="mt-8 inline-block border-b border-white pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-70"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
