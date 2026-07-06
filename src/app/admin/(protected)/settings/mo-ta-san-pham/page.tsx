import { getSiteSettings } from "@/lib/settings";
import { TextAreaField } from "@/components/admin/form/TextAreaField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { updateDefaultProductDescriptionAction } from "../actions";

export default async function AdminSettingsProductDescriptionPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Mô tả sản phẩm mặc định</h2>
      <p className="mt-1 font-mono text-xs text-graphite">
        Hiện ở mục &quot;Mô tả&quot; trên mọi trang sản phẩm. Sản phẩm nào cần nội dung riêng thì
        vào Sửa sản phẩm và nhập mô tả cho riêng sản phẩm đó — mô tả riêng sẽ thay thế mô tả chung
        này.
      </p>

      <form action={updateDefaultProductDescriptionAction} className="mt-6 flex flex-col gap-4">
        <TextAreaField
          id="defaultProductDescription"
          name="defaultProductDescription"
          label="Mô tả chung (áp dụng cho tất cả sản phẩm)"
          rows={10}
          defaultValue={settings?.defaultProductDescription ?? ""}
          hint="Xuống dòng thoải mái, giữ nguyên khi hiển thị. Để trống nếu không muốn hiện mục Mô tả."
        />

        <SubmitButton>Lưu thay đổi</SubmitButton>
      </form>
    </div>
  );
}
