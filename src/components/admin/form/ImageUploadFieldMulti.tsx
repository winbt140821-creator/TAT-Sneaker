"use client";

import { useState } from "react";
import Image from "next/image";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB — mirrors src/lib/uploads.ts
// Uploading dozens of photos as one unbounded Promise.all() burst overwhelms
// mobile connections (seen in practice: 38 photos at once over cellular data
// -> at least one PUT fails with a generic "Load failed" network error) —
// cap how many are in flight at once instead.
const UPLOAD_CONCURRENCY = 4;
const MAX_ATTEMPTS = 3;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadWithRetry(
  file: File,
  target: { uploadUrl: string; publicUrl: string; contentType?: string }
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const putRes = await fetch(target.uploadUrl, {
        method: "PUT",
        // The presigned R2 URL is signed against a Content-Type derived from
        // the file extension server-side (see src/lib/uploads.ts) — using
        // the browser's own file.type here instead can silently mismatch
        // (e.g. some mobile browsers report an empty/different MIME type for
        // camera-roll photos), which R2 rejects as a signature failure on
        // every single file, not just some — not a flaky-network symptom at
        // all despite looking like one.
        headers: { "Content-Type": target.contentType ?? file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(file.name);
      return target.publicUrl;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) await delay(attempt * 800);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(file.name);
}

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
  onImagesChange,
}: {
  name: string;
  label: string;
  initialImages?: string[];
  // Lets the parent form disable its submit button while an upload is in
  // flight — otherwise submitting mid-upload saves the form with that image
  // missing since its URL hasn't landed in the images array yet.
  onUploadingChange?: (uploading: boolean) => void;
  // Only needed when this field is rendered outside the <form> it belongs
  // to (e.g. a shared compose area feeding two different submit forms) —
  // lets the parent mirror the uploaded URLs into its own hidden inputs
  // instead of relying on this component's own (then-unreachable) ones.
  onImagesChange?: (images: string[]) => void;
}) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateUploading(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  function updateImages(next: string[]) {
    setImages(next);
    onImagesChange?.(next);
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

      const targets: { uploadUrl: string; publicUrl: string; contentType?: string }[] = data.targets;

      // Uploaded in small batches rather than one giant Promise.all() burst,
      // each file retries a couple of times on its own before being counted
      // as failed, and a failed file no longer discards every file that DID
      // succeed — each is tracked independently so a flaky connection loses
      // at most the files that failed after every retry.
      const succeeded: string[] = [];
      const failedNames: string[] = [];
      for (let start = 0; start < files.length; start += UPLOAD_CONCURRENCY) {
        const batch = files.slice(start, start + UPLOAD_CONCURRENCY);
        const results = await Promise.allSettled(
          batch.map((file, i) => uploadWithRetry(file, targets[start + i]))
        );
        results.forEach((r, i) => {
          if (r.status === "fulfilled") succeeded.push(r.value);
          else failedNames.push(batch[i].name);
        });
      }

      if (succeeded.length > 0) updateImages([...images, ...succeeded]);
      if (failedNames.length > 0) {
        setError(
          `Đã tự thử lại nhưng vẫn thất bại ${failedNames.length}/${files.length} ảnh — chọn lại các ảnh còn thiếu: ${failedNames.slice(0, 3).join(", ")}${failedNames.length > 3 ? "…" : ""}`
        );
      }
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
        {/* When onImagesChange is passed, the parent already renders its own
            gallery + hidden inputs for these same URLs (e.g. ComposeForm's
            "Ảnh đã chọn" section merges this with product-picked images) —
            showing this component's own preview too would just duplicate
            every uploaded photo on the page. */}
        {images.length > 0 && !onImagesChange && (
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
                  onClick={() => updateImages(images.filter((u) => u !== url))}
                  aria-label="Xoá ảnh"
                  className="absolute -right-2 -top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-stamp text-xs font-bold text-paper"
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
