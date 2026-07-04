import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

// `redirect`'s return type is `never` structurally, but it's derived from a
// heavily generic conditional type — TypeScript's control-flow analysis
// doesn't reliably treat calls to it as unreachable (e.g. `if (!x) redirect(...)`
// fails to narrow `x` afterwards). This thin wrapper has an explicit `: never`
// annotation, which TS trusts for narrowing, for guard-clause use sites.
export function redirectGuard(...args: Parameters<typeof redirect>): never {
  redirect(...args);
  throw new Error("unreachable");
}
