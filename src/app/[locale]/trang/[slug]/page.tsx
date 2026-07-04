import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { getStaticPage } from "@/lib/pages";
import { getSiteSettings } from "@/lib/settings";
import { languageAlternates } from "@/lib/seo";
import { site, defaultContactEmail } from "@/lib/site-config";
import { MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";

// Admin writes content as plain text (see PageForm.tsx) with two lightweight
// conventions: **bold** for emphasis, and a block where every line starts
// with "N. " renders as a numbered list. Blank lines separate paragraphs;
// single newlines within a paragraph become <br/>.
function renderInline(text: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  );
}

function renderContent(content: string) {
  const blocks = content.split("\n\n");
  return blocks.map((block, i) => {
    const lines = block.split("\n").filter((l) => l.trim());
    const isNumberedList = lines.length > 0 && lines.every((l) => /^\d+\.\s/.test(l.trim()));

    if (isNumberedList) {
      return (
        <ol key={i} className="list-decimal space-y-1.5 pl-5">
          {lines.map((line, j) => (
            <li key={j}>{renderInline(line.trim().replace(/^\d+\.\s/, ""), `${i}-${j}`)}</li>
          ))}
        </ol>
      );
    }

    return (
      <p key={i}>
        {lines.map((line, j) => (
          <span key={j}>
            {renderInline(line, `${i}-${j}`)}
            {j < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getStaticPage(slug);
  if (!page) return {};

  const plainContent = page.content.replace(/\*\*/g, "");
  const excerpt = plainContent.split("\n\n")[0]?.slice(0, 160) ?? plainContent.slice(0, 160);

  const path = `/trang/${slug}`;

  return {
    title: page.title,
    description: excerpt,
    alternates: { canonical: path, languages: languageAlternates(path) },
  };
}

export default async function StaticPageRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const page = await getStaticPage(slug);

  if (!page) notFound();

  const isContactPage = slug === "lien-he";
  const settings = isContactPage ? await getSiteSettings() : null;

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: page.title, path: `/trang/${slug}` }]} />
      <Header />
      <main className="flex-1">
        <Breadcrumb trail={[page.title]} />

        <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <h1 className="border-b border-kraft-dark pb-4 font-display text-2xl text-ink sm:text-3xl">
            {page.title}
          </h1>

          <div className="mt-6 flex flex-col gap-4 font-body text-sm leading-relaxed text-ink">
            {renderContent(page.content)}
          </div>

          {isContactPage && (
            <div className="die-cut-flat mt-8 flex flex-col gap-3 bg-kraft p-5">
              {settings?.address && (
                <p className="flex items-start gap-2 font-mono text-sm text-ink">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                  {settings.address}
                </p>
              )}
              <p className="flex items-center gap-2 font-mono text-sm text-ink">
                <PhoneIcon className="h-4 w-4 shrink-0 text-forest" />
                {settings?.phone || site.hotline}
              </p>
              <p className="flex items-center gap-2 font-mono text-sm text-ink">
                <MailIcon className="h-4 w-4 shrink-0 text-forest" />
                {settings?.email || defaultContactEmail}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
