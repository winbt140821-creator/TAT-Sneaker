import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";

export async function TestimonialsSection() {
  const [testimonials, t] = await Promise.all([
    prisma.testimonial.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 6,
    }),
    getTranslations("testimonials"),
  ]);

  if (testimonials.length === 0) return null;

  return (
    <section className="pb-12">
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
