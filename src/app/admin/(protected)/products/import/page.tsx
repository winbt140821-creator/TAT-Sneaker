import { AdminLink as Link } from "@/components/admin/AdminLink";
import { prisma } from "@/lib/db";
import { getAdminStore } from "@/lib/admin-store";
import { ImportTool } from "./ImportTool";

// Sản phẩm → Nhập sản phẩm: bring products in from a supplier's Yupoo shop
// or any other shop's page — photos copied into our storage, name
// translated, sizes read — hidden until staff check them and set a price.
export default async function ImportPage() {
  const [sources, categories, store] = await Promise.all([
    prisma.importSource.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, owner: true, label: true, department: true, password: true },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      select: {
        id: true,
        label: true,
        department: true,
        children: { select: { id: true, label: true }, orderBy: [{ sortOrder: "asc" }, { label: "asc" }] },
      },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    getAdminStore(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/products" className="font-mono text-xs text-graphite hover:text-ink hover:underline">
            ← Sản phẩm
          </Link>
          <h1 className="mt-1 font-display text-2xl text-ink">Nhập sản phẩm</h1>
        </div>
      </div>
      <p className="mt-2 max-w-2xl font-body text-sm text-graphite">
        Lấy sản phẩm từ Yupoo của nhà cung cấp hoặc từ web bán hàng khác: ảnh được tải về kho ảnh của bạn, tên tiếng
        Trung được dịch sang tiếng Việt. Sản phẩm mới nằm ở trạng thái ẩn để bạn xem lại và điền giá trước khi hiện lên
        web.
      </p>

      <ImportTool
        // The shop password stays on the server; the page only needs to
        // know whether one is saved.
        sources={sources.map(({ password, ...s }) => ({ ...s, hasPassword: !!password }))}
        categories={categories}
        preferredDepartment={store === "ALL" ? null : store}
      />
    </div>
  );
}
