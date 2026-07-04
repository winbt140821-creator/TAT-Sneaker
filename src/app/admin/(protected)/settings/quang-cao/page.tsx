import { getSiteSettings } from "@/lib/settings";
import { TextField } from "@/components/admin/form/TextField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { updateMarketingSettingsAction } from "../actions";

export default async function AdminSettingsMarketingPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Quảng cáo</h2>
      <p className="mt-1 font-mono text-xs text-graphite">
        Kết nối Meta Pixel để chạy quảng cáo chuyển đổi (đặt hàng) trên Facebook/Instagram — Meta
        cần dữ liệu này để tối ưu và đo hiệu quả quảng cáo.
      </p>

      <form action={updateMarketingSettingsAction} className="mt-6 flex flex-col gap-4">
        <TextField
          id="metaPixelId"
          name="metaPixelId"
          label="Meta Pixel ID"
          placeholder="VD: 1234567890123456"
          defaultValue={settings?.metaPixelId ?? ""}
          hint="Lấy tại Meta Business Suite > Trình quản lý sự kiện > Nguồn dữ liệu > Pixel của bạn > Cài đặt Pixel. Để trống nếu chưa dùng quảng cáo Meta."
        />

        <SubmitButton>Lưu thay đổi</SubmitButton>
      </form>
    </div>
  );
}
