"use client";

import { useState } from "react";
import Image from "next/image";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB — mirrors src/lib/uploads.ts

// Uploads go straight from the browser to R2 via a presigned URL — never
// through this form's Server Action. Vercel hard-caps Server Action/Function
// request bodies at ~4.5MB regardless of Next.js's own bodySizeLimit
// config; a couple of phone-camera photos in one submission blew past that
// and killed the whole request with a raw network error before it ever
// reached our code.
//
// Every image (kept from before + newly uploaded) ends up as a plain URL
// string under `name` — the Server Action just does formData.getAll(name)
// to get the final full list, no separate "keep" field needed.
export function ImageUploadFieldMulti({
  name,
  label,
  initialImages = [],
  onUploadingChange,
}: {
  name: string;
  label: string;
  initialImages?: string[];
  // Lets the parent form disable its submit button while an upload is in
  // flight — otherwise submitting mid-upload saves the form with that image
  // missing since its URL hasn't landed in the images array yet.
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateUploading(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" vượt quá 8MB.`);
      return;
    }

    setError(null);
    updateUploading(true);
    try {
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: files.map((f) => ({ name: f.name, size: f.size })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload thất bại");

      const targets: { uploadUrl: string; publicUrl: string }[] = data.targets;
      const uploadedUrls = await Promise.all(
        files.map(async (file, i) => {
          const target = targets[i];
          const putRes = await fetch(target.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!putRes.ok) throw new Error(`Upload "${file.name}" thất bại`);
          return target.publicUrl;
        })
      );

      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      updateUploading(false);
    }
  }

  return (
    <fieldset>
      <legend className="font-mono text-xs uppercase tracking-wide text-graphite">{label}</legend>
      <div className="mt-2 flex flex-col gap-3">
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((url) => (
              <div key={url} className="relative">
                <Image
                  src={url}
                  alt=""
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] border border-graphite object-cover"
                />
                <input type="hidden" name={name} value={url} />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                  aria-label="Xoá ảnh"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-stamp text-[10px] font-bold text-paper"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
          className="w-full max-w-full font-mono text-xs text-ink file:mr-3 file:cursor-pointer file:border file:border-graphite file:bg-paper file:px-3 file:py-1.5 file:font-mono file:text-xs file:uppercase disabled:opacity-50"
        />
        {uploading && <p className="font-mono text-xs text-graphite">Đang tải ảnh lên...</p>}
        {error && (
          <p role="alert" className="font-mono text-xs text-stamp">
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}
