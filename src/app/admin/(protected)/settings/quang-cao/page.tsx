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

        <TextField
          id="metaCapiAccessToken"
          name="metaCapiAccessToken"
          label="Mã thông báo truy cập API Chuyển đổi (Conversions API)"
          placeholder="Dán mã thông báo truy cập tại đây"
          defaultValue={settings?.metaCapiAccessToken ?? ""}
          hint="Lấy tại Trình quản lý sự kiện > chọn Pixel ở trên > Cài đặt > mục API Chuyển đổi > Tạo mã thông báo truy cập. Khi có, đơn hàng thành công (Purchase) cũng được gửi thẳng từ máy chủ — chính xác hơn, không bị chặn bởi trình duyệt/quảng cáo. Không bắt buộc để Pixel hoạt động, chỉ giúp tối ưu thêm."
        />

        <SubmitButton>Lưu thay đổi</SubmitButton>
      </form>
    </div>
  );
}
