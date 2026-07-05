"use client";

import { useState } from "react";
import Image from "next/image";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB — mirrors src/lib/uploads.ts

// Uploads go straight from the browser to R2 (or, in local dev without R2
// configured, to our own /api/admin/uploads/local route) via a presigned
// URL — never through this form's Server Action. Vercel hard-caps Server
// Action/Function request bodies at ~4.5MB regardless of Next.js's own
// bodySizeLimit config; a single modern phone photo can already be close to
// that on its own, and the old approach (raw File in the form body) got
// killed by a raw network error before the request ever reached our code.
//
// Once a new file finishes uploading, its URL is submitted as a plain string
// under `name` — the corresponding Server Action reads it with
// formData.get(name) same as before, just a URL instead of a File now.
//
// Covers both existing upload patterns in one component:
// - Settings-style: preview + a "remove" checkbox (pass removeFieldName)
// - News/Testimonial/Category-style: preview + hidden "keep current" field so
//   the action can tell "no new file" apart from "user wants it cleared"
//   (pass keepFieldName)
export function ImageUploadField({
  label,
  name,
  id,
  currentUrl,
  currentAlt = "",
  previewWidth = 120,
  previewHeight = 90,
  previewClassName,
  removeFieldName,
  removeLabel = "Gỡ ảnh, dùng mặc định",
  keepFieldName,
  unoptimized,
}: {
  label: string;
  name: string;
  id?: string;
  currentUrl?: string | null;
  currentAlt?: string;
  previewWidth?: number;
  previewHeight?: number;
  previewClassName?: string;
  removeFieldName?: string;
  removeLabel?: string;
  keepFieldName?: string;
  // QR codes are fine-grained b/w patterns — Next's default lossy
  // re-compression (quality=75) blurs their modules enough to break
  // scannability, so QR previews opt out of image optimization.
  unoptimized?: boolean;
}) {
  const inputId = id ?? name;
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = removed ? null : (uploadedUrl ?? currentUrl);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError(`"${file.name}" vượt quá 8MB.`);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [{ name: file.name, size: file.size }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload thất bại");

      const target = data.targets[0] as { uploadUrl: string; publicUrl: string };
      const putRes = await fetch(target.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload thất bại");

      setUploadedUrl(target.publicUrl);
      setRemoved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-mono text-xs uppercase tracking-wide text-graphite">
        {label}
      </label>

      {previewUrl && (
        <>
          <Image
            src={previewUrl}
            alt={currentAlt}
            width={previewWidth}
            height={previewHeight}
            unoptimized={unoptimized}
            className={previewClassName ?? "h-auto w-full max-w-[220px] object-contain"}
          />
          {uploadedUrl ? (
            <input type="hidden" name={name} value={uploadedUrl} />
          ) : (
            keepFieldName && <input type="hidden" name={keepFieldName} value={currentUrl!} />
          )}
        </>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="w-full max-w-full font-mono text-xs text-ink file:mr-3 file:cursor-pointer file:border file:border-graphite file:bg-paper file:px-3 file:py-1.5 file:font-mono file:text-xs file:uppercase disabled:opacity-50"
      />
      {uploading && <p className="font-mono text-xs text-graphite">Đang tải ảnh lên...</p>}
      {error && (
        <p role="alert" className="font-mono text-xs text-stamp">
          {error}
        </p>
      )}

      {removeFieldName && currentUrl && !uploadedUrl && (
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
          <input
            type="checkbox"
            name={removeFieldName}
            checked={removed}
            onChange={(e) => setRemoved(e.target.checked)}
          />
          {removeLabel}
        </label>
      )}
    </div>
  );
}
