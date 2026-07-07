import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import type { Prisma } from "@/generated/prisma/client";

// checkout (createOrderAction) decrements Product.sizeQuantities the moment
// an order is placed, before any payment/confirmation — so cancelling an
// order (by hand or via the sweep below) must give that stock back,
// otherwise repeatedly placing-then-cancelling orders permanently drains a
// size's stock without ever selling it.
export async function restoreOrderStock(
  db: typeof prisma | Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  const items = await db.orderItem.findMany({ where: { orderId } });
  if (items.length === 0) return;

  const products = await db.product.findMany({
    where: { id: { in: [...new Set(items.map((i) => i.productId))] } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) continue; // product row is gone somehow — nothing to restore onto

    const sizeQuantities = JSON.parse(product.sizeQuantities) as Record<string, number>;
    const key = String(item.size);
    sizeQuantities[key] = (sizeQuantities[key] ?? 0) + item.quantity;
    await db.product.update({
      where: { id: item.productId },
      data: { sizeQuantities: JSON.stringify(sizeQuantities) },
    });
  }
}

// Orders that require a deposit (per-product rule or "pay in full" choice)
// but never get it paid are effectively abandoned checkouts — left alone,
// they clutter the admin order list forever. When admin has configured a
// threshold (SiteSettings.autoCancelUnpaidDepositHours), sweep them into
// CANCELLED. Disabled entirely when the setting is null — admin cancels by
// hand in that case. Cheap to call on every admin order-list/dashboard
// render since the WHERE clause only ever matches genuinely stale rows.
export async function autoCancelStaleOrders(): Promise<void> {
  // getSiteSettings() is wrapped in React's cache() — reusing it here means
  // a page that also reads site settings elsewhere in the same request only
  // pays for one query instead of two.
  const settings = await getSiteSettings();
  const hours = settings?.autoCancelUnpaidDepositHours;
  if (!hours || hours <= 0) return;

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const stale = await prisma.order.findMany({
    where: {
      status: "PENDING",
      depositAmount: { gt: 0 },
      depositPaid: false,
      createdAt: { lt: cutoff },
    },
    select: { id: true },
  });
  if (stale.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const { id } of stale) {
      await restoreOrderStock(tx, id);
      await tx.order.update({ where: { id }, data: { status: "CANCELLED" } });
    }
  });
}
