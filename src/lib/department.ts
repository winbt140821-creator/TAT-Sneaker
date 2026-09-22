import { headers } from "next/headers";
import type { Department } from "./inventory";

export type { Department };

// src/proxy.ts sets this header from the request hostname before any
// Server Component runs — quanao.tatsneaker.vn gets "CLOTHING", everything
// else (including local dev) defaults to "SHOES". Server-only (next/headers)
// — client components must receive department as a prop from their server
// parent instead of calling this directly.
export async function getDepartment(): Promise<Department> {
  const h = await headers();
  return h.get("x-department") === "CLOTHING" ? "CLOTHING" : "SHOES";
}
