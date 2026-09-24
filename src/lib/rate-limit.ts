import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

// Abuse limits for public actions (placing an order, looking one up), keyed
// by action + client IP. Counted in the database (RateLimit table) so every
// server instance shares one count — the earlier in-memory counter reset on
// each cold start and was split across instances, so a bot spread over a
// few instances was barely slowed down.
//
// Fixed window: the first hit opens a window of `windowMs`; up to `max`
// hits are allowed in it. One statement per check. If the database can't be
// reached, it falls back to the in-memory counter below rather than
// blocking real customers from checking out.

/** Returns true if `key` (e.g. "createOrder:1.2.3.4") is still within `max`
 *  hits for its current window, and records this hit. */
export async function checkRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  try {
    const nowIso = new Date(now).toISOString();
    const windowOpenedBefore = new Date(now - windowMs).toISOString();
    const rows = await prisma.$queryRaw<{ count: number | bigint }[]>(Prisma.sql`
      INSERT INTO "RateLimit" ("key", "windowStart", "count") VALUES (${key}, ${nowIso}, 1)
      ON CONFLICT("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."windowStart" <= ${windowOpenedBefore} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "windowStart" = CASE WHEN "RateLimit"."windowStart" <= ${windowOpenedBefore} THEN excluded."windowStart" ELSE "RateLimit"."windowStart" END
      RETURNING "count"
    `);
    // Now and then, drop counters nobody has touched for a day.
    if (Math.random() < 0.02) {
      await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "windowStart" < ${new Date(now - 86_400_000).toISOString()}`;
    }
    return Number(rows[0]?.count ?? 1) <= max;
  } catch (err) {
    console.error("rate limit: database unavailable, using in-memory counter", err);
    return checkInMemory(key, max, windowMs, now);
  }
}

// Fallback only — per-instance, best effort.
const hits = new Map<string, number[]>();

function checkInMemory(key: string, max: number, windowMs: number, now: number): boolean {
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  if (hits.size > 5000) {
    for (const [k, ts] of hits) if (ts.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
}
