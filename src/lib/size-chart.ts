import { prisma } from "./db";

export type SizeChartEntry = { vn: string; us: string; uk: string; cm: string };

// Fallback shown until a brand gets its own custom table via
// /admin/categories/[id]/size-chart.
export const DEFAULT_SIZE_CHART: SizeChartEntry[] = [
  { vn: "36", us: "4", uk: "3.5", cm: "22.5" },
  { vn: "37", us: "5", uk: "4", cm: "23" },
  { vn: "38", us: "6", uk: "5", cm: "24" },
  { vn: "39", us: "6.5", uk: "5.5", cm: "24.5" },
  { vn: "40", us: "7", uk: "6", cm: "25" },
  { vn: "41", us: "8", uk: "7", cm: "25.5" },
  { vn: "42", us: "8.5", uk: "7.5", cm: "26.5" },
  { vn: "43", us: "9.5", uk: "8.5", cm: "27.5" },
  { vn: "44", us: "10", uk: "9", cm: "28.5" },
  { vn: "45", us: "11", uk: "10", cm: "29" },
];

export async function getSizeChartForCategory(
  categoryId: string | undefined
): Promise<SizeChartEntry[]> {
  if (!categoryId) return DEFAULT_SIZE_CHART;

  const rows = await prisma.sizeChartRow.findMany({
    where: { categoryId },
    orderBy: { sortOrder: "asc" },
  });

  if (rows.length === 0) return DEFAULT_SIZE_CHART;

  return rows.map((r) => ({ vn: r.vnSize, us: r.usSize, uk: r.ukSize, cm: r.cmSize }));
}
