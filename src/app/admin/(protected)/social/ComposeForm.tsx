"use client";

import { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import { SearchIcon } from "@/components/icons";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import { ImageUploadFieldMulti } from "@/components/admin/form/ImageUploadFieldMulti";
import { publishNowAction, schedulePostAction, type ComposeFormState } from "./actions";

type Account = { id: string; platform: "FACEBOOK" | "INSTAGRAM"; name: string };
type Product = { id: string; sku: string; name: string; priceLabel: string; images: string[] };

const initialState: ComposeFormState = {};

export function ComposeForm({
  accounts,
  products,
  catalogConfigured,
}: {
  accounts: Account[];
  products: Product[];
  catalogConfigured: boolean;
}) {
  const [publishState, publishAction] = useActionState(publishNowAction, initialState);
  const [scheduleState, scheduleAction] = useActionState(schedulePostAction, initialState);

  const [message, setMessage] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, productSearch]);

  // Chọn 1 sản phẩm -> lấy TOÀN BỘ ảnh của nó + soạn sẵn nội dung (tên + giá)
  // để người dùng chỉ cần bổ sung thêm mô tả, không phải gõ lại từ đầu.
  function pickProduct(p: Product) {
    setActiveProductId(p.id);
    setSelectedImages(p.images);
    setMessage(`${p.name}\nGiá: ${p.priceLabel}`);
  }

  const allImages = useMemo(
    () => [...new Set([...selectedImages, ...uploadedImages])],
    [selectedImages, uploadedImages]
  );

  function toggleTarget(id: string) {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Removing an image the picked product came with means the post no longer
  // shows that product's own photos, so the auto-tag would misidentify what's
  // in the picture — clear the pick rather than keep tagging a photo the
  // product picker no longer fully owns.
  function removeImage(url: string) {
    setSelectedImages((prev) => prev.filter((u) => u !== url));
    setUploadedImages((prev) => prev.filter((u) => u !== url));
    setActiveProductId(null);
  }

  const hasTargets = selectedTargets.size > 0;
  const commonFields = (
    <>
      <input type="hidden" name="message" value={message} />
      {activeProductId && <input type="hidden" name="productId" value={activeProductId} />}
      {[...selectedTargets].map((id) => (
        <input key={id} type="hidden" name="targetIds" value={id} />
      ))}
      {allImages.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}
    </>
  );

  return (
    <div className="die-cut bg-paper p-4">
      <h2 className="font-display text-lg text-ink">Soạn bài</h2>

      {/* Chọn trang */}
      <fieldset className="mt-4">
        <legend className="font-mono text-xs uppercase tracking-wide text-graphite">Chọn trang để đăng</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {accounts.map((a) => {
            const checked = selectedTargets.has(a.id);
            return (
              <label
                key={a.id}
                className={
                  "die-cut-flat flex cursor-pointer items-center gap-2 bg-kraft px-3 py-2 transition-colors " +
                  (checked ? "border-forest bg-forest/10" : "hover:border-forest")
                }
              >
                <input type="checkbox" checked={checked} onChange={() => toggleTarget(a.id)} className="sr-only" />
                <span
                  className={
                    "px-1.5 py-0.5 font-mono text-[10px] uppercase text-paper " +
                    (a.platform === "FACEBOOK" ? "bg-[#1877F2]" : "bg-[#D6249F]")
                  }
                >
                  {a.platform === "FACEBOOK" ? "FB" : "IG"}
                </span>
                <span className="font-body text-sm text-ink">{a.name}</span>
              </label>
            );
          })}
          {accounts.length === 0 && (
            <p className="font-mono text-xs text-graphite">Chưa có trang nào — kết nối ở phần trên.</p>
          )}
        </div>
      </fieldset>

      {/* Nội dung */}
      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="message" className="font-mono text-xs uppercase tracking-wide text-graphite">
          Nội dung
        </label>
        <textarea
          id="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nhập nội dung bài viết…"
          className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
        />
      </div>

      {/* Ảnh đã chọn */}
      {allImages.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {allImages.map((url) => (
            <div key={url} className="relative">
              <Image src={url} alt="" width={72} height={72} className="h-[72px] w-[72px] border border-graphite object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Bỏ ảnh"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-stamp text-[10px] font-bold text-paper"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Chọn sản phẩm để đăng nguyên (tự lấy hết ảnh + soạn sẵn nội dung) */}
      <fieldset className="mt-4">
        <legend className="font-mono text-xs uppercase tracking-wide text-graphite">
          Chọn 1 sản phẩm để đăng (tự lấy hết ảnh + soạn sẵn nội dung)
        </legend>
        {catalogConfigured ? (
          <p className="mt-1 font-mono text-[11px] text-graphite">
            Ảnh của sản phẩm được chọn sẽ tự động gắn thẻ sản phẩm khi đăng lên Facebook.
          </p>
        ) : (
          <p className="mt-1 font-mono text-[11px] text-stamp">
            Chưa cấu hình META_CATALOG_ID trên server — bài đăng vẫn lên bình thường nhưng sẽ không tự gắn thẻ sản phẩm.
          </p>
        )}
        <div className="relative mt-2">
          <input
            type="search"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã SKU sản phẩm..."
            className="w-full border border-graphite bg-paper px-3 py-2 pr-9 text-sm text-ink focus:border-forest"
          />
          <SearchIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
        </div>

        <div className="mt-2 grid max-h-96 grid-cols-2 gap-2 overflow-y-auto die-cut-flat bg-kraft p-2 sm:grid-cols-3 md:grid-cols-4">
          {filteredProducts.map((p) => {
            const active = activeProductId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pickProduct(p)}
                className={
                  "die-cut-flat flex cursor-pointer flex-col gap-1.5 bg-paper p-2 text-left transition-colors " +
                  (active ? "border-forest bg-forest/5" : "hover:border-forest")
                }
              >
                <div className="relative aspect-square overflow-hidden bg-kraft-dark/30">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt="" fill sizes="150px" className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-graphite">
                      Không ảnh
                    </span>
                  )}
                  {active && (
                    <div className="absolute inset-0 flex items-center justify-center bg-forest/20">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-paper">✓</div>
                    </div>
                  )}
                </div>
                <p className="font-mono text-[10px] text-graphite">
                  {p.sku} · {p.images.length} ảnh
                </p>
                <p className="line-clamp-2 font-body text-xs text-ink">{p.name}</p>
                <p className="font-mono text-[11px] text-ink">{p.priceLabel}</p>
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <p className="col-span-full font-mono text-xs text-graphite">Không tìm thấy sản phẩm nào.</p>
          )}
        </div>
      </fieldset>

      {/* Upload từ máy */}
      <div className="mt-4">
        <ImageUploadFieldMulti
          name="__uploaded"
          label="Hoặc tải ảnh mới lên"
          onUploadingChange={setUploading}
          onImagesChange={setUploadedImages}
        />
      </div>

      {/* 2 form riêng: đăng ngay / hẹn giờ — cùng field ẩn, khác action */}
      <div className="mt-5 flex flex-wrap items-end gap-4 border-t border-graphite/30 pt-4">
        <form action={publishAction} className="contents">
          {commonFields}
          <SubmitButton disabled={!hasTargets || uploading} pendingLabel="Đang đăng...">
            🚀 Đăng ngay
          </SubmitButton>
        </form>

        <span className="font-mono text-xs text-graphite">hoặc hẹn giờ:</span>

        <form action={scheduleAction} className="flex items-end gap-2">
          {commonFields}
          <input
            type="datetime-local"
            name="scheduledAt"
            className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
          />
          <SubmitButton
            disabled={!hasTargets || uploading}
            pendingLabel="Đang lưu..."
            className="w-fit cursor-pointer bg-graphite px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            📅 Lên lịch
          </SubmitButton>
        </form>
      </div>

      <FormError message={publishState.error || scheduleState.error} />
      {(publishState.ok || scheduleState.ok) && (
        <p className="mt-2 font-mono text-xs text-forest">Đã lưu thành công!</p>
      )}
    </div>
  );
}
