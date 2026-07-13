import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export type RevenueBucket = "day" | "week" | "month" | "year";

const STRFTIME_FORMAT: Record<RevenueBucket, string> = {
  day: "%Y-%m-%d",
  week: "%Y-W%W",
  month: "%Y-%m",
  year: "%Y",
};

// Multiple simultaneous status groupings, shown side by side so staff can
// compare confirmed vs. in-flight revenue for the same period — not a
// single filtered number. CANCELLED orders are never counted.
export const REVENUE_STATUS_GROUPS = {
  done: ["DONE"],
  processing: ["CONFIRMED", "SHIPPED"],
  pending: ["PENDING"],
} as const;

export type RevenueStatusGroup = keyof typeof REVENUE_STATUS_GROUPS;

export type RevenueTotals = Record<RevenueStatusGroup, number>;

export interface RevenueBucketRow {
  period: string;
  revenue: number;
  orderCount: number;
}

function revenueForStatuses(statuses: readonly string[], from: Date, to: Date) {
  return prisma.$queryRaw<{ revenue: number | null }[]>(
    Prisma.sql`
      SELECT SUM(oi.price * oi.quantity) as revenue
      FROM "Order" o
      JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${from.toISOString()}
        AND o."createdAt" <= ${to.toISOString()}
        AND o.status IN (${Prisma.join(statuses)})
    `,
  );
}

export async function getRevenueTotals(from: Date, to: Date): Promise<RevenueTotals> {
  const [done, processing, pending] = await Promise.all([
    revenueForStatuses(REVENUE_STATUS_GROUPS.done, from, to),
    revenueForStatuses(REVENUE_STATUS_GROUPS.processing, from, to),
    revenueForStatuses(REVENUE_STATUS_GROUPS.pending, from, to),
  ]);

  return {
    done: done[0]?.revenue ?? 0,
    processing: processing[0]?.revenue ?? 0,
    pending: pending[0]?.revenue ?? 0,
  };
}

// Bucketed trend for the "done" group only — the safest/primary revenue
// figure to chart over time.
export async function getRevenueByBucket(
  bucket: RevenueBucket,
  from: Date,
  to: Date,
): Promise<RevenueBucketRow[]> {
  const fmt = STRFTIME_FORMAT[bucket];
  // createdAt is stored in UTC; shift by Vietnam's fixed UTC+7 offset before
  // formatting so a bucket boundary falls on the Vietnam calendar day/week/
  // month/year, not the UTC one — otherwise orders placed between midnight
  // and 7am local time get bucketed into the previous day.
  const rows = await prisma.$queryRaw<{ period: string; revenue: number | null; orderCount: number }[]>(
    Prisma.sql`
      SELECT strftime(${fmt}, o."createdAt", '+7 hours') as period,
             SUM(oi.price * oi.quantity) as revenue,
             COUNT(DISTINCT o.id) as orderCount
      FROM "Order" o
      JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${from.toISOString()}
        AND o."createdAt" <= ${to.toISOString()}
        AND o.status IN (${Prisma.join(REVENUE_STATUS_GROUPS.done)})
      GROUP BY period
      ORDER BY period ASC
    `,
  );

  return rows.map((r) => ({
    period: r.period,
    revenue: r.revenue ?? 0,
    orderCount: Number(r.orderCount),
  }));
}

// Profit for the "done" group only — revenue minus cost price, matching the
// same status scope as the trend above.
export async function getProfitTotal(from: Date, to: Date): Promise<number> {
  const rows = await prisma.$queryRaw<{ profit: number | null }[]>(
    Prisma.sql`
      SELECT SUM((oi.price - oi."costPrice") * oi.quantity) as profit
      FROM "Order" o
      JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${from.toISOString()}
        AND o."createdAt" <= ${to.toISOString()}
        AND o.status IN (${Prisma.join(REVENUE_STATUS_GROUPS.done)})
    `,
  );
  return rows[0]?.profit ?? 0;
}

export interface TopProductRow {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

// Best-selling products (by quantity) for the "done" group, so staff can see
// which items to restock/promote.
export async function getTopProducts(from: Date, to: Date, limit = 10): Promise<TopProductRow[]> {
  const rows = await prisma.$queryRaw<
    { productId: string; name: string; quantity: number; revenue: number | null }[]
  >(
    Prisma.sql`
      SELECT oi."productId" as productId, p.name as name,
             SUM(oi.quantity) as quantity,
             SUM(oi.price * oi.quantity) as revenue
      FROM "Order" o
      JOIN "OrderItem" oi ON oi."orderId" = o.id
      JOIN "Product" p ON p.id = oi."productId"
      WHERE o."createdAt" >= ${from.toISOString()}
        AND o."createdAt" <= ${to.toISOString()}
        AND o.status IN (${Prisma.join(REVENUE_STATUS_GROUPS.done)})
      GROUP BY oi."productId", p.name
      ORDER BY quantity DESC
      LIMIT ${limit}
    `,
  );

  return rows.map((r) => ({
    productId: r.productId,
    name: r.name,
    quantity: Number(r.quantity),
    revenue: r.revenue ?? 0,
  }));
}
