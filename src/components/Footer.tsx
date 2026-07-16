import Script from "next/script";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site, defaultContactEmail } from "@/lib/site-config";
import { getSiteSettings, getSocialLinks } from "@/lib/settings";
import {
  ChevronRightIcon,
  FacebookIcon,
  InstagramIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  MessengerIcon,
  PhoneIcon,
  TiktokIcon,
  YoutubeIcon,
  ZaloIcon,
} from "./icons";

// Literal class names (not template-interpolated) so Tailwind's static scan
// picks them up. Mobile order: Social, Policy, Support, About, Brand.
// Desktop order (sm:) restores the original visual arrangement: Brand,
// Policy, Support, About, Social.
const COLUMN_ORDER = ["order-2 sm:order-2", "order-3 sm:order-3", "order-4 sm:order-4"];

const SOCIAL_ICONS: Record<string, typeof FacebookIcon> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  messenger: MessengerIcon,
  tiktok: TiktokIcon,
  youtube: YoutubeIcon,
  zalo: ZaloIcon,
};

// Real brand colors so each platform is recognizable at a glance, matching
// the "Đăng nhập bằng Facebook" button's use of #1877F2 elsewhere.
const SOCIAL_BG: Record<string, string> = {
  facebook: "bg-[#1877F2]",
  instagram: "bg-[linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)]",
  messenger: "bg-[#0084FF]",
  tiktok: "bg-black",
  youtube: "bg-[#FF0000]",
  zalo: "bg-[#0068FF]",
};

export async function Footer() {
  const [settings, socialLinks, t] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
    getTranslations("footer"),
  ]);

  const phone = settings?.phone || site.hotline;
  const email = settings?.email || defaultContactEmail;

  const columns: { title: string; links: { label: string; slug: string }[] }[] = [
    {
      title: t("policyTitle"),
      links: [
        { label: t("policyReturns"), slug: "doi-tra-bao-hanh" },
        { label: t("policyPrivacy"), slug: "bao-mat-thong-tin" },
        { label: t("policyTerms"), slug: "dieu-khoan-su-dung" },
      ],
    },
    {
      title: t("supportTitle"),
      links: [
        { label: t("supportOrdering"), slug: "huong-dan-dat-hang" },
        { label: t("supportPayment"), slug: "huong-dan-thanh-toan" },
        { label: t("supportShipping"), slug: "van-chuyen" },
      ],
    },
    {
      title: t("aboutTitle", { siteName: site.name }),
      links: [
        { label: t("aboutIntro"), slug: "gioi-thieu" },
        { label: t("aboutCareers"), slug: "tuyen-dung" },
        { label: t("aboutContact"), slug: "lien-he" },
      ],
    },
  ];

  const byPlatform = new Map(socialLinks.map((l) => [l.platform.toLowerCase(), l]));
  const messengerLink = byPlatform.get("messenger");
  const tiktokLink = byPlatform.get("tiktok");
  const zaloLink = byPlatform.get("zalo");
  const facebookLink = byPlatform.get("facebook");

  return (
    <>
      <footer className="mt-auto border-t-4 border-forest bg-ink text-kraft">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:grid-cols-5">
          <div className="order-1 col-span-2 sm:order-5 sm:col-span-1">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-paper">
              {t("socialTitle")}
            </p>
            {socialLinks.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {socialLinks.map((link) => {
                  const key = link.platform.toLowerCase();
                  const Icon = SOCIAL_ICONS[key] ?? LinkIcon;
                  const bg = SOCIAL_BG[key] ?? "bg-graphite";
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.platform}
                      title={link.platform}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform hover:scale-110 ${bg}`}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 font-mono text-xs text-graphite">{t("socialUpdating")}</p>
            )}

            {facebookLink && (
              <div className="mt-3 max-w-[340px] overflow-hidden">
                <div id="fb-root" />
                {/* Graph API versions expire ~2 years after release (v19.0
                    expired 2026-05-21) — the widget fails silently on every
                    device once the pinned version lapses, not just in
                    certain browsers, so this needs bumping again well before
                    v23.0's own expiry. */}
                <Script
                  src="https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v23.0"
                  strategy="lazyOnload"
                />
                <div
                  className="fb-page"
                  data-href={facebookLink.url}
                  data-tabs=""
                  data-width="340"
                  data-height=""
                  data-small-header="false"
                  data-adapt-container-width="true"
                  data-hide-cover="false"
                  data-show-facepile="false"
                >
                  <blockquote cite={facebookLink.url} className="fb-xfbml-parameter">
                    <a href={facebookLink.url}>{site.name}</a>
                  </blockquote>
                </div>
              </div>
            )}
          </div>

          {columns.map((col, i) => (
            <div key={col.title} className={COLUMN_ORDER[i]}>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-paper">
                {col.title}
              </p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/trang/${l.slug}`}
                      className="flex items-center gap-1 font-body text-sm text-kraft hover:text-paper hover:underline"
                    >
                      <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-forest sm:hidden" />
                      {l.label}
                    </Link>
                  </li>
                ))}
                {i === 1 && (
                  <li>
                    <Link
                      href="/tra-cuu-don-hang"
                      className="flex items-center gap-1 font-body text-sm text-kraft hover:text-paper hover:underline"
                    >
                      <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-forest sm:hidden" />
                      {t("supportOrderLookup")}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}

          <div className="order-5 col-span-2 sm:order-1 md:col-span-1">
            <p className="font-display text-xl font-bold uppercase text-paper">{site.name}</p>

            {settings?.footerAbout && (
              <p className="mt-2 max-w-xs font-body text-xs leading-relaxed text-kraft">
                {settings.footerAbout}
              </p>
            )}

            <div className="mt-3 flex flex-col gap-1.5">
              {settings?.address && (
                <p className="flex items-start gap-1.5 font-mono text-xs text-graphite">
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
                  {settings.address}
                </p>
              )}
              <p className="flex items-center gap-1.5 font-mono text-xs text-graphite">
                <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-forest" />
                {phone}
              </p>
              <p className="flex items-center gap-1.5 font-mono text-xs text-graphite">
                <MailIcon className="h-3.5 w-3.5 shrink-0 text-forest" />
                {email}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-graphite/40 px-4 py-4 text-center font-mono text-[11px] text-graphite sm:px-6">
          © {new Date().getFullYear()} {site.name}. {t("rights")}
        </div>
      </footer>

      {/* Reserves space so the fixed bottom nav bar below never covers the
          copyright line above — scoped here, not on <body>, so it doesn't
          also pad admin pages (which don't render Footer). */}
      <div className="h-14 sm:hidden" />

      <nav
        aria-label={t("socialTitle")}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-graphite/40 bg-ink sm:hidden"
      >
        {messengerLink ? (
          <a
            href={messengerLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 py-2.5 text-[#0084FF]"
          >
            <MessengerIcon className="h-5 w-5" />
            <span className="font-mono text-[10px] uppercase text-kraft">Messenger</span>
          </a>
        ) : (
          <span />
        )}
        <a href={`tel:${phone}`} className="flex flex-col items-center gap-1 py-2.5 text-forest">
          <PhoneIcon className="h-5 w-5" />
          <span className="font-mono text-[10px] uppercase text-kraft">{t("aboutContact")}</span>
        </a>
        {tiktokLink ? (
          <a
            href={tiktokLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 py-2.5 text-paper"
          >
            <TiktokIcon className="h-5 w-5" />
            <span className="font-mono text-[10px] uppercase text-kraft">TikTok</span>
          </a>
        ) : (
          <span />
        )}
        {zaloLink ? (
          <a
            href={zaloLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 py-2.5 text-[#0068FF]"
          >
            <ZaloIcon className="h-5 w-5" />
            <span className="font-mono text-[10px] uppercase text-kraft">Zalo</span>
          </a>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
