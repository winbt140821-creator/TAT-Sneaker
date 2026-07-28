"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildVietQrUrl } from "@/lib/vietqr-banks";
import { ShieldCheckIcon, ZaloIcon } from "@/components/icons";

// Local single-purpose icons — icons.tsx has no copy/check/download glyphs and
// these are only ever used by this panel, so keep them self-contained.
function CopyGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}
function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DownloadGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
    </svg>
  );
}

const formatVnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

// A label + value row with a big tap-target copy button. The value stays fully
// visible (and copyable) even when the QR image fails to load, so a customer
// on a flaky connection can always fall back to a manual transfer.
function CopyRow({
  label,
  value,
  copyValue,
  emphasize,
}: {
  label: string;
  value: string;
  copyValue: string;
  emphasize?: boolean;
}) {
  const t = useTranslations("checkout");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyValue);
    } catch {
      // clipboard API blocked (insecure context / permissions) — last-resort
      // selection copy so the button still does something on older mobiles.
      const ta = document.createElement("textarea");
      ta.value = copyValue;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing else to try */
      }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b border-kraft-dark py-2 last:border-b-0">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wide text-graphite">{label}</p>
        <p
          className={`truncate font-mono ${
            emphasize ? "text-base font-bold text-forest" : "text-sm font-semibold text-ink"
          }`}
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={t("copyButton")}
        className={`flex h-10 shrink-0 items-center gap-1.5 border px-3 font-mono text-[11px] uppercase tracking-wide transition-colors ${
          copied
            ? "border-forest bg-forest/10 text-forest"
            : "border-graphite bg-paper text-ink active:bg-kraft"
        }`}
      >
        {copied ? <CheckGlyph className="h-4 w-4" /> : <CopyGlyph className="h-4 w-4" />}
        {copied ? t("copiedButton") : t("copyButton")}
      </button>
    </div>
  );
}

export function BankTransferPanel({
  orderCode,
  amount,
  remaining,
  isDeposit,
  leadTimeDays,
  holdHours,
  bankName,
  bankAccountNumber,
  bankAccountHolder,
  bankBin,
  bankTransferQrUrl,
  zaloLink,
}: {
  orderCode: string;
  amount: number;
  remaining: number;
  isDeposit: boolean;
  leadTimeDays: number;
  holdHours?: number | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  bankBin?: string | null;
  bankTransferQrUrl?: string | null;
  zaloLink?: string | null;
}) {
  const t = useTranslations("checkout");
  const [imgFailed, setImgFailed] = useState(false);

  const dynamicQrUrl =
    bankBin && bankAccountNumber
      ? buildVietQrUrl({
          bin: bankBin,
          accountNumber: bankAccountNumber,
          accountName: bankAccountHolder,
          amount,
          addInfo: orderCode,
        })
      : null;
  const qrUrl = dynamicQrUrl ?? bankTransferQrUrl ?? null;

  async function saveQr() {
    if (!qrUrl) return;
    try {
      // Best-effort real download. img.vietqr.io may not send CORS headers, in
      // which case the fetch throws and we fall back to opening the image so
      // the customer can long-press → save (the universal mobile gesture).
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR-${orderCode}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="inline-flex items-center gap-1.5 border border-forest bg-forest/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-forest">
          <CheckGlyph className="h-3.5 w-3.5" />
          {t("qrPanelBadge")}
        </span>
        <h1 className="mt-1 font-display text-2xl text-ink">{t("scanToPay")}</h1>
        <p className="font-mono text-xs text-graphite">{t("qrPanelOrderCode", { code: orderCode })}</p>
      </div>

      <div className="die-cut flex flex-col gap-3 bg-paper p-4">
        <p className="text-center font-mono text-xs text-graphite">{t("qrScanHint")}</p>

        {qrUrl && !imgFailed ? (
          <div className="flex justify-center">
            <Image
              src={qrUrl}
              alt={t("scanToPay")}
              width={240}
              height={240}
              unoptimized
              onError={() => setImgFailed(true)}
              className="h-auto w-full max-w-[240px]"
            />
          </div>
        ) : (
          <p className="rounded border border-dashed border-graphite p-4 text-center font-mono text-[11px] text-graphite">
            {t("qrManualHint")}
          </p>
        )}

        {qrUrl && !imgFailed && (
          <button
            type="button"
            onClick={saveQr}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 border border-graphite bg-paper font-mono text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:border-forest hover:text-forest active:bg-kraft"
          >
            <DownloadGlyph className="h-4 w-4" />
            {t("saveQrButton")}
          </button>
        )}
      </div>

      <div className="die-cut flex flex-col bg-paper px-4 py-1">
        <CopyRow label={t("amountLabel")} value={formatVnd(amount)} copyValue={String(amount)} emphasize />
        {bankName && (
          <div className="flex items-center justify-between gap-2 border-b border-kraft-dark py-2">
            <p className="font-mono text-[10px] uppercase tracking-wide text-graphite">{t("bankNameLabel")}</p>
            <p className="font-mono text-sm font-semibold text-ink">{bankName}</p>
          </div>
        )}
        {bankAccountNumber && (
          <CopyRow
            label={t("bankAccountNumberLabel")}
            value={bankAccountNumber}
            copyValue={bankAccountNumber}
          />
        )}
        {bankAccountHolder && (
          <div className="flex items-center justify-between gap-2 border-b border-kraft-dark py-2">
            <p className="font-mono text-[10px] uppercase tracking-wide text-graphite">
              {t("bankAccountHolderLabel")}
            </p>
            <p className="font-mono text-sm font-semibold text-ink">{bankAccountHolder}</p>
          </div>
        )}
        <CopyRow label={t("transferMemoLabel")} value={orderCode} copyValue={orderCode} emphasize />
      </div>

      <p className="border-l-2 border-stamp bg-stamp/5 px-3 py-2 font-mono text-[11px] text-ink">
        ⚠️ {t("transferMemoWarning")}
      </p>

      {bankAccountHolder && (
        <p className="flex items-start gap-2 font-mono text-[11px] text-graphite">
          <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
          {t("accountHolderVerified")}
        </p>
      )}

      {isDeposit && remaining > 0 && (
        <p className="font-mono text-[11px] text-graphite">
          {t("qrRemainingOnDelivery", { amount: formatVnd(remaining) })}
        </p>
      )}

      <p className="font-mono text-[11px] text-graphite">
        {leadTimeDays > 0
          ? t("qrNextSteps", { days: leadTimeDays })
          : t("qrNextStepsNoLead")}
      </p>

      {holdHours && holdHours > 0 && (
        <p className="font-mono text-[11px] text-graphite">{t("qrHoldNote", { hours: holdHours })}</p>
      )}

      <div className="mt-1 flex flex-col gap-2.5">
        <Link
          href={`/don-hang/${orderCode}`}
          className="flex h-12 w-full cursor-pointer items-center justify-center bg-forest font-mono text-sm font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-forest-dark"
        >
          {t("iPaidButton")}
        </Link>
        {zaloLink && (
          <a
            href={zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 border border-graphite bg-paper font-mono text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:border-forest hover:text-forest"
          >
            <ZaloIcon className="h-5 w-5" />
            {t("qrHelpZalo")}
          </a>
        )}
      </div>
    </div>
  );
}
