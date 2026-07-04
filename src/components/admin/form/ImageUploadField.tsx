import Image from "next/image";

// Covers both existing upload patterns in one component:
// - Settings-style: preview + a "remove" checkbox (pass removeFieldName)
// - News/Testimonial-style: preview + hidden "keep current" field so the
//   action can tell "no new file" apart from "user wants it cleared"
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

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-mono text-xs uppercase tracking-wide text-graphite">
        {label}
      </label>

      {currentUrl && (
        <>
          <Image
            src={currentUrl}
            alt={currentAlt}
            width={previewWidth}
            height={previewHeight}
            unoptimized={unoptimized}
            className={previewClassName ?? "h-auto w-full max-w-[220px] object-contain"}
          />
          {keepFieldName && <input type="hidden" name={keepFieldName} value={currentUrl} />}
        </>
      )}

      <input
        id={inputId}
        name={name}
        type="file"
        accept="image/*"
        className="w-full max-w-full font-mono text-xs text-ink file:mr-3 file:cursor-pointer file:border file:border-graphite file:bg-paper file:px-3 file:py-1.5 file:font-mono file:text-xs file:uppercase"
      />

      {removeFieldName && currentUrl && (
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-graphite">
          <input type="checkbox" name={removeFieldName} />
          {removeLabel}
        </label>
      )}
    </div>
  );
}
