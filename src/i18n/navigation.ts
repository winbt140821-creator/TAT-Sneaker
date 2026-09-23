import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Link and useRouter are the store-aware versions (see store-navigation.tsx
// and src/lib/store-path.ts): hrefs are written store-agnostic and resolve
// to the store the page is being viewed in. redirect/getPathname stay plain
// — server code that redirects passes storeHref(await getDepartment(), …)
// itself, since the current store is only known asynchronously there.
export {
  Link,
  GatewayLink,
  useRouter,
  useStoreUrl,
  DepartmentProvider,
  useStoreDepartment,
} from "./store-navigation";
export const { redirect, usePathname, getPathname } = createNavigation(routing);

// `redirect`'s return type is `never` structurally, but it's derived from a
// heavily generic conditional type — TypeScript's control-flow analysis
// doesn't reliably treat calls to it as unreachable (e.g. `if (!x) redirect(...)`
// fails to narrow `x` afterwards). This thin wrapper has an explicit `: never`
// annotation, which TS trusts for narrowing, for guard-clause use sites.
export function redirectGuard(...args: Parameters<typeof redirect>): never {
  redirect(...args);
  throw new Error("unreachable");
}
