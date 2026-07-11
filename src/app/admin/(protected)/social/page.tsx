import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { isMetaConfigured, isCatalogConfigured, getFacebookLoginUrl } from "@/lib/meta";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { ComposeForm } from "./ComposeForm";
import { deleteSocialPostAction, disconnectSocialAccountAction } from "./actions";

export default async function AdminSocialPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [accounts, posts, products] = await Promise.all([
    // Never select accessToken here — this result (via `accounts` below)
    // gets passed straight into <ComposeForm>, a Client Component, which
    // would serialize the raw Facebook Page token into the page's HTML/RSC
    // payload for anyone to read. Server Actions re-fetch the token
    // themselves server-side (see actions.ts loadTargets) using only the
    // account id the client sends back.
    prisma.socialAccount.findMany({
      select: { id: true, platform: true, name: true, avatarUrl: true },
      orderBy: { connectedAt: "desc" },
    }),
    prisma.socialPost.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.product.findMany({
      where: { hidden: false },
      select: { id: true, sku: true, name: true, images: true, price: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    priceLabel: formatPrice(p.price),
    images: JSON.parse(p.images || "[]") as string[],
  }));

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Mạng xã hội</h1>
      <p className="mt-1 font-mono text-xs text-graphite">
        Đăng bài lên Facebook Page &amp; Instagram, lấy ảnh trực tiếp từ sản phẩm trong kho.
      </p>

      {error && (
        <p role="alert" className="mt-4 die-cut-flat bg-stamp/10 p-3 font-mono text-xs text-stamp">
          {decodeURIComponent(error)}
        </p>
      )}

      {/* Kết nối tài khoản */}
      <div className="mt-6 die-cut bg-paper p-4">
        <h2 className="font-display text-lg text-ink">Tài khoản đã kết nối</h2>

        {!isMetaConfigured() && (
          <p className="mt-2 die-cut-flat bg-stamp/10 p-3 font-mono text-xs text-stamp">
            Chưa cấu hình META_APP_ID / META_APP_SECRET trên server.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-3">
          {accounts.map((a) => (
            <div key={a.id} className="die-cut-flat flex items-center gap-3 bg-kraft p-3">
              {a.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              )}
              <div className="min-w-0">
                <span
                  className={
                    "inline-block px-1.5 py-0.5 font-mono text-[10px] uppercase text-paper " +
                    (a.platform === "FACEBOOK" ? "bg-[#1877F2]" : "bg-[#D6249F]")
                  }
                >
                  {a.platform === "FACEBOOK" ? "Facebook" : "Instagram"}
                </span>
                <p className="truncate font-body text-sm text-ink">{a.name}</p>
              </div>
              <form action={disconnectSocialAccountAction.bind(null, a.id)}>
                <ConfirmSubmitButton
                  label="Ngắt"
                  confirmMessage={`Ngắt kết nối "${a.name}"?`}
                  className="cursor-pointer font-mono text-[11px] uppercase text-graphite hover:text-stamp hover:underline"
                />
              </form>
            </div>
          ))}
          {accounts.length === 0 && (
            <p className="font-mono text-xs text-graphite">Chưa có tài khoản nào.</p>
          )}
        </div>

        {isMetaConfigured() && (
          <a
            href={getFacebookLoginUrl()}
            className="mt-4 inline-block cursor-pointer bg-ink px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft"
          >
            + Kết nối Facebook / Instagram
          </a>
        )}
      </div>

      {/* Soạn & đăng bài */}
      <div className="mt-6">
        <ComposeForm accounts={accounts} products={productOptions} catalogConfigured={isCatalogConfigured()} />
      </div>

      {/* Lịch sử */}
      <div className="mt-6 die-cut bg-paper p-4">
        <h2 className="font-display text-lg text-ink">Lịch sử &amp; hẹn giờ</h2>
        <div className="mt-3 flex flex-col gap-2">
          {posts.length === 0 && <p className="font-mono text-xs text-graphite">Chưa có bài nào.</p>}
          {posts.map((p) => {
            const images = JSON.parse(p.images || "[]") as string[];
            const statusLabel: Record<string, string> = {
              SCHEDULED: "Đã lên lịch",
              PUBLISHED: "Đã đăng",
              PARTIAL: "Đăng 1 phần",
              FAILED: "Thất bại",
            };
            const statusColor: Record<string, string> = {
              SCHEDULED: "bg-[#1e40af] text-paper",
              PUBLISHED: "bg-forest text-paper",
              PARTIAL: "bg-amber-600 text-paper",
              FAILED: "bg-stamp text-paper",
            };
            return (
              <div key={p.id} className="die-cut-flat flex flex-wrap items-start justify-between gap-3 bg-kraft p-3">
                <div className="min-w-0 flex-1">
                  <span className={`px-1.5 py-0.5 font-mono text-[10px] uppercase ${statusColor[p.status]}`}>
                    {statusLabel[p.status]}
                  </span>
                  <p className="mt-1.5 line-clamp-2 font-body text-sm text-ink">{p.message || "(không có chữ)"}</p>
                  {images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {images.slice(0, 6).map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={url} src={url} alt="" className="h-12 w-12 object-cover" />
                      ))}
                    </div>
                  )}
                  <p className="mt-1.5 font-mono text-[10px] text-graphite">
                    {p.status === "SCHEDULED" && p.scheduledAt
                      ? `Hẹn giờ: ${p.scheduledAt.toLocaleString("vi-VN")}`
                      : p.publishedAt
                        ? `Đăng: ${p.publishedAt.toLocaleString("vi-VN")}`
                        : ""}
                  </p>
                </div>
                <form action={deleteSocialPostAction.bind(null, p.id)}>
                  <ConfirmSubmitButton
                    label="Xoá"
                    confirmMessage="Xoá bài này khỏi lịch sử?"
                    className="cursor-pointer font-mono text-[11px] uppercase text-graphite hover:text-stamp hover:underline"
                  />
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
