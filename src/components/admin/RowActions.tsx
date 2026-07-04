import Link from "next/link";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

// Sửa/Xóa pair used at the end of every admin list row. Padded to a ~44px
// touch target (vs. the old bare text links) so it's easier to tap
// accurately on a phone screen.
export function RowActions({
  editHref,
  editLabel = "Sửa",
  deleteAction,
  deleteConfirmMessage,
  compact = false,
}: {
  editHref: string;
  editLabel?: string;
  deleteAction?: (formData: FormData) => Promise<void> | void;
  deleteConfirmMessage?: string;
  compact?: boolean;
}) {
  const textSize = compact ? "text-[11px]" : "text-xs";
  const base = `flex min-h-11 items-center px-2 font-mono ${textSize} uppercase tracking-wide hover:underline`;

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Link href={editHref} className={`${base} text-graphite hover:text-ink`}>
        {editLabel}
      </Link>
      {deleteAction && (
        <form action={deleteAction}>
          <ConfirmSubmitButton
            label="Xóa"
            confirmMessage={deleteConfirmMessage ?? "Xóa mục này?"}
            className={`${base} cursor-pointer text-stamp`}
          />
        </form>
      )}
    </div>
  );
}
