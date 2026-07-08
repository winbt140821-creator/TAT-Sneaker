import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

// Every admin list page renders dozens of links at once (13 sidebar nav
// items on every page, one "Sửa" per row, every pagination number) — Next.js
// prefetches each one the instant it's visible in the viewport, and each
// prefetch is a full server-rendered request (real DB queries included). A
// single product list view was firing 300+ background requests this way,
// each competing with the actual click the admin was waiting on. Prefetching
// buys nothing for an internal staff tool (no one rapid-clicks through
// dozens of admin pages), so it's off by default here instead of having to
// remember `prefetch={false}` at every call site.
export function AdminLink({
  prefetch = false,
  ...props
}: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode }) {
  return <Link prefetch={prefetch} {...props} />;
}
