import { getSiteSettings } from "@/lib/settings";
import { ImageUploadField } from "@/components/admin/form/ImageUploadField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { updateLogoAction } from "../actions";

export default async function AdminSettingsLogoPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Logo</h2>
      <p className="mt-1 font-mono text-xs text-graphite">
        Hiện thay cho chữ &ldquo;{`{tên shop}`}.&rdquo; ở đầu trang, chân trang và khu vực quản
        trị. Để trống nếu muốn dùng chữ mặc định.
      </p>

      <form action={updateLogoAction} className="mt-6 flex max-w-md flex-col gap-4">
        <ImageUploadField
          id="logoImage"
          name="image"
          label={settings?.logoUrl ? "Thay logo mới" : "Tải lên logo"}
          currentUrl={settings?.logoUrl}
          currentAlt="Logo hiện tại"
          previewWidth={220}
          previewHeight={80}
          removeFieldName="remove"
          removeLabel="Gỡ logo, dùng chữ mặc định"
        />

        <SubmitButton>Lưu thay đổi</SubmitButton>
      </form>
    </div>
  );
}
