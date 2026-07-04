import { getSiteSettings } from "@/lib/settings";
import { TextField } from "@/components/admin/form/TextField";
import { TextAreaField } from "@/components/admin/form/TextAreaField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { updateContactInfoAction } from "../actions";

export default async function AdminSettingsContactPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Thông tin liên hệ</h2>
      <p className="mt-1 font-mono text-xs text-graphite">
        Hiển thị ở chân trang. Để trống mục nào sẽ ẩn mục đó khỏi chân trang.
      </p>

      <form action={updateContactInfoAction} className="mt-6 flex flex-col gap-4">
        <TextField id="address" name="address" label="Địa chỉ" defaultValue={settings?.address ?? ""} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="phone"
            name="phone"
            label="Số điện thoại"
            type="tel"
            defaultValue={settings?.phone ?? ""}
          />

          <TextField
            id="email"
            name="email"
            label="Email"
            type="email"
            defaultValue={settings?.email ?? ""}
          />
        </div>

        <TextAreaField
          id="footerAbout"
          name="footerAbout"
          label="Giới thiệu ngắn (chân trang)"
          rows={3}
          defaultValue={settings?.footerAbout ?? ""}
        />

        <SubmitButton>Lưu thay đổi</SubmitButton>
      </form>
    </div>
  );
}
