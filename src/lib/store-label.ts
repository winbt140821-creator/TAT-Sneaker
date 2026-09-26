import type { Department } from "./inventory";

// Isomorphic (no server-only imports), so admin client components can use it.
export const STORE_LABEL: Record<Department, string> = { SHOES: "Giày", CLOTHING: "Quần áo" };
