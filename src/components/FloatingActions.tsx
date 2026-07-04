import { getSocialLinks } from "@/lib/settings";
import { MessengerIcon, ZaloIcon } from "./icons";
import { ScrollToTopButton } from "./ScrollToTopButton";

const QUICK_CONTACT: { platform: string; Icon: typeof MessengerIcon; className: string }[] = [
  { platform: "messenger", Icon: MessengerIcon, className: "bg-[#0084FF]" },
  { platform: "zalo", Icon: ZaloIcon, className: "bg-[#0068FF]" },
];

export async function FloatingActions() {
  const links = await getSocialLinks();
  const byPlatform = new Map(links.map((l) => [l.platform.toLowerCase(), l]));

  return (
    <div className="fixed bottom-20 right-4 z-30 flex flex-col items-center gap-3 sm:bottom-4">
      <ScrollToTopButton />
      {/* Messenger/Zalo bubbles are redundant on mobile — the fixed bottom
          nav bar in Footer.tsx already covers those. Desktop-only here. */}
      {QUICK_CONTACT.map(({ platform, Icon, className }) => {
        const link = byPlatform.get(platform);
        if (!link) return null;
        return (
          <a
            key={platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.platform}
            title={link.platform}
            className={`hidden h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 sm:flex ${className}`}
          >
            <Icon className="h-6 w-6" />
          </a>
        );
      })}
    </div>
  );
}
