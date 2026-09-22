import { getBranding } from "@/lib/settings";
import { SingleImageUploadForm } from "@/components/admin/form/SingleImageUploadForm";
import { DepartmentTabs } from "@/components/admin/DepartmentTabs";
import { updateLogoAction } from "../actions";
import type { Department } from "@/lib/inventory";

export default async function AdminSettingsLogoPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department: departmentParam } = await searchParams;
  const department: Department = departmentParam === "CLOTHING" ? "CLOTHING" : "SHOES";
  const branding = await getBranding(department);

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Logo</h2>
      <p className="mt-1 font-mono text-xs text-graphite">
        Hiện thay cho chữ &ldquo;{`{tên shop}`}.&rdquo; ở đầu trang, chân trang và khu vực quản
        trị. Để trống nếu muốn dùng chữ mặc định.
      </p>

      <DepartmentTabs basePath="/admin/settings/logo" department={department} className="mt-4" />

      <div className="mt-6">
        <SingleImageUploadForm
          action={updateLogoAction.bind(null, department)}
          id="logoImage"
          name="image"
          label={branding?.logoUrl ? "Thay logo mới" : "Tải lên logo"}
          currentUrl={branding?.logoUrl}
          currentAlt="Logo hiện tại"
          previewWidth={220}
          previewHeight={80}
          removeFieldName="remove"
          removeLabel="Gỡ logo, dùng chữ mặc định"
        />
      </div>
    </div>
  );
}
