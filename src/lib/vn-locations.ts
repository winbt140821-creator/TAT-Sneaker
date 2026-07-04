import raw from "./vn-locations.json";

// Vendored from thanglequoc/vietnamese-provinces-database (MIT) — 34
// provinces/cities and their wards per the 01/07/2025 administrative merger
// (2-level structure, no more Quận/Huyện). Names are snapshotted onto each
// Order at checkout time rather than referenced live, so this file can be
// safely updated later without touching historical orders.
type RawWard = { Code: string; FullName: string; ProvinceCode: string };
type RawProvince = { Code: string; FullName: string; Wards: RawWard[] };

export type Ward = { code: string; name: string };
export type Province = { code: string; name: string; wards: Ward[] };

export const PROVINCES: Province[] = (raw as RawProvince[]).map((p) => ({
  code: p.Code,
  name: p.FullName,
  wards: p.Wards.map((w) => ({ code: w.Code, name: w.FullName })),
}));

export function getWardsByProvinceCode(provinceCode: string): Ward[] {
  return PROVINCES.find((p) => p.code === provinceCode)?.wards ?? [];
}
