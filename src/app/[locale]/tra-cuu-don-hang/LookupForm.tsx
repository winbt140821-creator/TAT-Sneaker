"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { lookupGuestOrderAction } from "./actions";

export function LookupForm() {
  const t = useTranslations("orderLookup");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await lookupGuestOrderAction({
      code: String(formData.get("code") ?? ""),
      email: String(formData.get("email") ?? ""),
    });

    if (result.error || !result.code) {
      setError(result.error ?? t("notFound"));
      setPending(false);
      return;
    }

    router.push(`/don-hang/${result.code}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="font-mono text-xs uppercase tracking-wide text-graphite">
          {t("orderCode")}
        </label>
        <input
          id="code"
          name="code"
          required
          placeholder={t("orderCodePlaceholder")}
          className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-mono text-xs uppercase tracking-wide text-graphite">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={t("emailPlaceholder")}
          className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
        />
      </div>

      {error && (
        <p role="alert" className="font-mono text-xs text-stamp">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full cursor-pointer bg-forest px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>

      <p className="text-center font-mono text-[11px] text-graphite">
        {t("loggedInHint")}{" "}
        <Link href="/tai-khoan/don-hang" className="cursor-pointer text-forest underline hover:text-forest-dark">
          {t("loggedInHintLink")}
        </Link>
      </p>
    </form>
  );
}
