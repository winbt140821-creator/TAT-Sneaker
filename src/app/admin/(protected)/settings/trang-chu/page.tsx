import Image from "next/image";
import { getSiteSettings } from "@/lib/settings";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { updateHeroImagesAction, updateHeroContentAction } from "../actions";

export default async function AdminSettingsHomePage() {
  const settings = await getSiteSettings();
  const heroImages: string[] = settings?.heroImages
    ? JSON.parse(settings.heroImages)
    : settings?.heroImageUrl
      ? [settings.heroImageUrl]
      : [];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-display text-xl text-ink">Ảnh bìa</h2>
        <p className="mt-1 font-mono text-xs text-graphite">
          Nhiều ảnh sẽ tự động chạy dạng slideshow ở banner đầu trang chủ. Để trống nếu muốn dùng
          thiết kế mặc định (không ảnh).
        </p>

        <form action={updateHeroImagesAction} className="mt-6 flex max-w-md flex-col gap-3">
          {heroImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {heroImages.map((url) => (
                <div key={url} className="flex flex-col items-center gap-1">
                  <Image
                    src={url}
                    alt=""
                    width={120}
                    height={68}
                    className="h-[68px] w-[120px] border border-graphite object-cover"
                  />
                  <label className="flex items-center gap-1 font-mono text-[10px] text-graphite">
                    <input type="checkbox" name="keepImages" value={url} defaultChecked />
                    Giữ
                  </label>
                </div>
              ))}
            </div>
          )}
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            className="w-full max-w-full font-mono text-xs text-ink file:mr-3 file:cursor-pointer file:border file:border-graphite file:bg-paper file:px-3 file:py-1.5 file:font-mono file:text-xs file:uppercase"
          />

          <SubmitButton>Lưu thay đổi</SubmitButton>
        </form>
      </div>

      <div className="border-t border-kraft-dark pt-8">
        <h2 className="font-display text-xl text-ink">Nội dung banner</h2>
        <p className="mt-1 font-mono text-xs text-graphite">
          Bỏ tích để ẩn mục đó khỏi banner mà không mất nội dung đã nhập. Để trống ô chữ sẽ dùng
          nội dung mặc định.
        </p>

        <form action={updateHeroContentAction} className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
              <input
                type="checkbox"
                name="heroEyebrowEnabled"
                defaultChecked={settings?.heroEyebrowEnabled ?? true}
              />
              Hiện dòng nhãn nhỏ
            </label>
            <input
              name="heroEyebrow"
              placeholder="Kho hàng · Giày Sneaker"
              defaultValue={settings?.heroEyebrow ?? ""}
              className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
              <input
                type="checkbox"
                name="heroHeadingEnabled"
                defaultChecked={settings?.heroHeadingEnabled ?? true}
              />
              Hiện tiêu đề lớn
            </label>
            <textarea
              name="heroHeading"
              rows={2}
              placeholder={"HÀNG VỀ\nMỖI NGÀY"}
              defaultValue={settings?.heroHeading ?? ""}
              className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
            />
            <p className="font-mono text-[10px] text-graphite">Xuống dòng để tách thành 2 dòng tiêu đề.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
              <input
                type="checkbox"
                name="heroDescriptionEnabled"
                defaultChecked={settings?.heroDescriptionEnabled ?? true}
              />
              Hiện đoạn mô tả
            </label>
            <textarea
              name="heroDescription"
              rows={2}
              defaultValue={settings?.heroDescription ?? ""}
              className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
              <input
                type="checkbox"
                name="heroStatsEnabled"
                defaultChecked={settings?.heroStatsEnabled ?? true}
              />
              Hiện hàng số liệu (3 mục)
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((n) => {
                const valueKey = `heroStat${n}Value` as "heroStat1Value" | "heroStat2Value" | "heroStat3Value";
                const labelKey = `heroStat${n}Label` as "heroStat1Label" | "heroStat2Label" | "heroStat3Label";
                return (
                  <div key={n} className="die-cut-flat flex flex-col gap-2 bg-paper p-3">
                    <input
                      name={valueKey}
                      placeholder={n === 1 ? "1.000+" : n === 2 ? "3 bước" : "7 ngày"}
                      defaultValue={settings?.[valueKey] ?? ""}
                      className="border border-graphite bg-paper px-2 py-1.5 text-sm text-ink focus:border-forest"
                    />
                    <input
                      name={labelKey}
                      placeholder={
                        n === 1
                          ? "Đôi đang có sẵn"
                          : n === 2
                            ? "Kiểm định trước khi ship"
                            : "Hỗ trợ đổi size"
                      }
                      defaultValue={settings?.[labelKey] ?? ""}
                      className="border border-graphite bg-paper px-2 py-1.5 font-mono text-xs text-ink focus:border-forest"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <SubmitButton>Lưu thay đổi</SubmitButton>
        </form>
      </div>
    </div>
  );
}
