import { getSocialLinks } from "@/lib/settings";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import {
  FacebookIcon,
  InstagramIcon,
  MessengerIcon,
  TiktokIcon,
  YoutubeIcon,
  ZaloIcon,
} from "@/components/icons";
import { createSocialLinkAction, deleteSocialLinkAction, toggleSocialLinkAction } from "../actions";

// Fixed set matching the icons Footer.tsx already knows how to render
// (keyed by lowercase platform name) — admin picks an icon instead of typing
// a free-text platform name that might not match any known icon.
const SOCIAL_PLATFORMS = [
  { value: "Facebook", Icon: FacebookIcon, bg: "bg-[#1877F2]" },
  { value: "Messenger", Icon: MessengerIcon, bg: "bg-[#0084FF]" },
  { value: "TikTok", Icon: TiktokIcon, bg: "bg-black" },
  { value: "Zalo", Icon: ZaloIcon, bg: "bg-[#0068FF]" },
  { value: "Instagram", Icon: InstagramIcon, bg: "bg-[linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)]" },
  { value: "YouTube", Icon: YoutubeIcon, bg: "bg-[#FF0000]" },
] as const;

export default async function AdminSettingsSocialPage() {
  const socialLinks = await getSocialLinks(false);

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Mạng xã hội</h2>
      <p className="mt-1 font-mono text-xs text-graphite">
        Bấm &quot;Ẩn/Hiện&quot; để bật tắt hiển thị một liên kết trên trang chủ mà không cần xóa.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {socialLinks.length === 0 && (
          <p className="font-mono text-xs text-graphite">Chưa có liên kết nào.</p>
        )}
        {socialLinks.map((link) => (
          <div key={link.id} className="die-cut-flat flex flex-wrap items-center gap-4 bg-paper p-3">
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-medium text-ink">{link.platform}</p>
              <p className="truncate font-mono text-xs text-graphite">{link.url}</p>
            </div>
            <span
              className={
                "shrink-0 px-2 py-1 font-mono text-[10px] uppercase tracking-wide " +
                (link.enabled ? "bg-forest text-paper" : "bg-graphite text-paper")
              }
            >
              {link.enabled ? "Đang hiện" : "Đang ẩn"}
            </span>
            <div className="flex shrink-0 items-center gap-3">
              <form action={toggleSocialLinkAction.bind(null, link.id)}>
                <button
                  type="submit"
                  className="cursor-pointer font-mono text-xs uppercase tracking-wide text-graphite hover:text-ink hover:underline"
                >
                  {link.enabled ? "Ẩn" : "Hiện"}
                </button>
              </form>
              <form action={deleteSocialLinkAction.bind(null, link.id)}>
                <ConfirmSubmitButton
                  label="Xóa"
                  confirmMessage={`Xóa liên kết "${link.platform}"?`}
                  className="cursor-pointer font-mono text-xs uppercase tracking-wide text-stamp hover:underline"
                />
              </form>
            </div>
          </div>
        ))}
      </div>

      <form action={createSocialLinkAction} className="die-cut-flat mt-6 flex flex-col gap-3 bg-kraft p-4">
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-xs uppercase tracking-wide text-graphite">Nền tảng</p>
          <div className="flex flex-wrap gap-3">
            {SOCIAL_PLATFORMS.map((p) => (
              <label
                key={p.value}
                className="flex cursor-pointer flex-col items-center gap-1.5 border border-graphite bg-paper p-3 has-[:checked]:border-forest has-[:checked]:bg-forest/10"
              >
                <input type="radio" name="platform" value={p.value} required className="sr-only" />
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${p.bg}`}>
                  <p.Icon className="h-4 w-4" />
                </span>
                <span className="font-mono text-[10px] text-ink">{p.value}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="url" className="font-mono text-xs uppercase tracking-wide text-graphite">
              Đường dẫn
            </label>
            <input
              id="url"
              name="url"
              type="url"
              required
              placeholder="https://..."
              className="w-full border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
            />
          </div>
          <button
            type="submit"
            className="h-fit cursor-pointer bg-ink px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
          >
            + Thêm
          </button>
        </div>
      </form>
    </div>
  );
}
