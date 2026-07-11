"use client";

import { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import { SearchIcon } from "@/components/icons";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import { FormError } from "@/components/admin/form/FormError";
import { ImageUploadFieldMulti } from "@/components/admin/form/ImageUploadFieldMulti";
import { publishNowAction, schedulePostAction, type ComposeFormState } from "./actions";

type Account = { id: string; platform: "FACEBOOK" | "INSTAGRAM"; name: string };
type Product = { id: string; sku: string; name: string; images: string[] };

const initialState: ComposeFormState = {};

export function ComposeForm({ accounts, products }: { accounts: Account[]; products: Product[] }) {
  const [publishState, publishAction] = useActionState(publishNowAction, initialState);
  const [scheduleState, scheduleAction] = useActionState(schedulePostAction, initialState);

  const [message, setMessage] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 12);
  }, [products, productSearch]);

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

  function toggleImage(url: string) {
    setSelectedImages((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  }

  function removeImage(url: string) {
    setSelectedImages((prev) => prev.filter((u) => u !== url));
    setUploadedImages((prev) => prev.filter((u) => u !== url));
  }

  const hasTargets = selectedTargets.size > 0;
  const commonFields = (
    <>
      <input type="hidden" name="message" value={message} />
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

      {/* Chọn ảnh theo sản phẩm */}
      <fieldset className="mt-4">
        <legend className="font-mono text-xs uppercase tracking-wide text-graphite">
          Lấy ảnh từ 1 sản phẩm trong kho
        </legend>
        <div className="relative mt-2">
          <input
            type="search"
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setActiveProduct(null);
            }}
            placeholder="Tìm theo tên hoặc mã SKU sản phẩm..."
            className="w-full border border-graphite bg-paper px-3 py-2 pr-9 text-sm text-ink focus:border-forest"
          />
          <SearchIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
        </div>

        {filteredProducts.length > 0 && !activeProduct && (
          <div className="mt-2 flex flex-col gap-1 die-cut-flat bg-kraft p-2">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveProduct(p)}
                className="cursor-pointer px-2 py-1.5 text-left font-mono text-xs text-ink hover:bg-paper"
              >
                {p.name} <span className="text-graphite">({p.sku})</span> — {p.images.length} ảnh
              </button>
            ))}
          </div>
        )}

        {activeProduct && (
          <div className="mt-2 die-cut-flat bg-kraft p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-body text-sm text-ink">{activeProduct.name}</p>
              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                className="cursor-pointer font-mono text-[11px] uppercase text-graphite hover:underline"
              >
                Đổi sản phẩm
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {activeProduct.images.map((url) => {
                const checked = selectedImages.includes(url);
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => toggleImage(url)}
                    className={
                      "relative aspect-square overflow-hidden border-2 " +
                      (checked ? "border-forest" : "border-transparent")
                    }
                  >
                    <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
