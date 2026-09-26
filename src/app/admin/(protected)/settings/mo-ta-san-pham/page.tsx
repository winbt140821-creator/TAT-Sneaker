import { getBranding } from "@/lib/settings";
import { editingStore, getAdminStore, STORE_LABEL } from "@/lib/admin-store";
import { DepartmentTabs } from "@/components/admin/DepartmentTabs";
import { TextAreaField } from "@/components/admin/form/TextAreaField";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { updateDefaultProductDescriptionAction } from "../actions";

export default async function AdminSettingsProductDescriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department: departmentParam } = await searchParams;
  // An explicit tab (?department=) wins; otherwise follow the admin store switch.
  const department = editingStore(departmentParam, await getAdminStore());
  const branding = await getBranding(department);
  const store = STORE_LABEL[department].toLowerCase();

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Mô tả sản phẩm mặc định</h2>
      <p className="mt-1 font-mono text-xs text-graphite">
        Hiện ở mục &quot;Mô tả&quot; trên mọi trang sản phẩm của cửa hàng {store}. Sản phẩm nào cần nội
        dung riêng thì vào Sửa sản phẩm và nhập mô tả cho riêng sản phẩm đó — mô tả riêng sẽ thay thế
        mô tả chung này.
      </p>

      <DepartmentTabs basePath="/admin/settings/mo-ta-san-pham" department={department} className="mt-4" />

      {/* key: remount when switching store so the field shows that store's text. */}
      <form
        key={department}
        action={updateDefaultProductDescriptionAction.bind(null, department)}
        className="mt-6 flex flex-col gap-4"
      >
        <TextAreaField
          id="defaultProductDescription"
          name="defaultProductDescription"
          label={`Mô tả chung (áp dụng cho tất cả sản phẩm ${store})`}
          rows={10}
          defaultValue={branding?.defaultProductDescription ?? ""}
          hint="Xuống dòng thoải mái, giữ nguyên khi hiển thị. Để trống nếu không muốn hiện mục Mô tả."
        />

        <SubmitButton>Lưu thay đổi</SubmitButton>
      </form>
    </div>
  );
}
