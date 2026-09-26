import { getBranding } from "@/lib/settings";
import { editingStore, getAdminStore } from "@/lib/admin-store";
import { DepartmentTabs } from "@/components/admin/DepartmentTabs";
import { TextField } from "@/components/admin/form/TextField";
import { TextAreaField } from "@/components/admin/form/TextAreaField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { updateContactInfoAction } from "../actions";

export default async function AdminSettingsContactPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department: departmentParam } = await searchParams;
  // An explicit tab (?department=) wins; otherwise follow the admin store switch.
  const department = editingStore(departmentParam, await getAdminStore());
  const branding = await getBranding(department);

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Thông tin liên hệ</h2>
      <p className="mt-1 font-mono text-xs text-graphite">
        Hiển thị ở chân trang và trang Liên hệ của từng cửa hàng. Để trống mục nào sẽ ẩn mục đó khỏi
        chân trang.
      </p>

      <DepartmentTabs basePath="/admin/settings/lien-he" department={department} className="mt-4" />

      {/* key: remount when switching store so the fields show that store's values. */}
      <form
        key={department}
        action={updateContactInfoAction.bind(null, department)}
        className="mt-6 flex flex-col gap-4"
      >
        <TextField id="address" name="address" label="Địa chỉ" defaultValue={branding?.address ?? ""} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="phone"
            name="phone"
            label="Số điện thoại"
            type="tel"
            defaultValue={branding?.phone ?? ""}
          />

          <TextField
            id="email"
            name="email"
            label="Email"
            type="email"
            defaultValue={branding?.email ?? ""}
          />
        </div>

        <TextAreaField
          id="footerAbout"
          name="footerAbout"
          label="Giới thiệu ngắn (chân trang)"
          rows={3}
          defaultValue={branding?.footerAbout ?? ""}
        />

        <SubmitButton>Lưu thay đổi</SubmitButton>
      </form>
    </div>
  );
}
