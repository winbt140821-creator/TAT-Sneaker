"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { DashboardIcon } from "./icons";

// Fetched client-side (see src/app/api/admin/session/route.ts) instead of
// Header calling getCurrentStaff() server-side — that would force every
// customer page to skip static rendering/caching just to know whether the
// current visitor also happens to be logged-in staff.
export function AdminLinkButton() {
  const t = useTranslations("header");
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setIsStaff(Boolean(data.isStaff));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isStaff) return null;

  return (
    <NextLink
      href="/admin"
      aria-label={t("adminLinkAria")}
      className="die-cut-flat flex h-10 shrink-0 cursor-pointer items-center gap-1.5 bg-ink px-2.5 text-paper transition-colors hover:bg-ink-soft sm:px-3"
    >
      <DashboardIcon className="h-4 w-4" />
      <span className="hidden font-mono text-xs font-semibold uppercase tracking-wide sm:inline">
        {t("adminLink")}
      </span>
    </NextLink>
  );
}
