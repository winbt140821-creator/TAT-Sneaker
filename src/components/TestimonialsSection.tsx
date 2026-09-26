import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import type { Department } from "@/lib/inventory";

// Each store shows only its own reviews (admin → Đánh giá, per store).
export async function TestimonialsSection({ department = "SHOES" }: { department?: Department }) {
  const [testimonials, t] = await Promise.all([
    prisma.testimonial.findMany({
      where: { department },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: department === "CLOTHING" ? 3 : 6,
    }),
    getTranslations("testimonials"),
  ]);

  if (testimonials.length === 0) return null;

  if (department === "CLOTHING") {
    // Customers' words set as quiet serif statements between hairlines,
    // the name in small caps underneath — no cards, no avatars.
    return (
      <section className="cv-auto border-t border-kraft-dark px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.16em] text-ink">{t("title")}</h2>
        <div className="mt-10 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
          {testimonials.map((item) => (
            <figure key={item.id} className="flex flex-col">
              <blockquote className="font-display text-xl leading-snug text-ink">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-graphite">
                {item.authorName}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="cv-auto pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center font-display text-2xl text-ink">
          {t("title")}
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.id} className="die-cut flex flex-col gap-4 bg-paper p-5">
              <p className="font-body text-sm leading-relaxed text-ink">
                <span aria-hidden="true" className="mr-1 font-display text-xl text-forest">
                  &ldquo;
                </span>
                {t.quote}
                <span aria-hidden="true" className="ml-1 font-display text-xl text-forest">
                  &rdquo;
                </span>
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-kraft-dark/40">
                  {t.avatarUrl ? (
                    <Image
                      src={t.avatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-mono text-xs text-graphite">
                      {t.authorName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs font-semibold uppercase tracking-wide text-ink">
                  {t.authorName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
