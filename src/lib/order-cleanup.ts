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

  // Accumulate in memory first so an order with two line items for the same
  // product (different sizes) gets one update, not two, and so distinct
  // products can be written concurrently instead of one at a time.
  const pendingQuantities = new Map<string, Record<string, number>>();
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) continue; // product row is gone somehow — nothing to restore onto

    const sizeQuantities =
      pendingQuantities.get(item.productId) ??
      (JSON.parse(product.sizeQuantities) as Record<string, number>);
    const key = String(item.size);
    sizeQuantities[key] = (sizeQuantities[key] ?? 0) + item.quantity;
    pendingQuantities.set(item.productId, sizeQuantities);
  }

  await Promise.all(
    [...pendingQuantities.entries()].map(([productId, sizeQuantities]) =>
      db.product.update({
        where: { id: productId },
        data: { sizeQuantities: JSON.stringify(sizeQuantities) },
      })
    )
  );
}

// Orders that require a deposit (per-product rule or "pay in full" choice)
// but never get it paid are effectively abandoned checkouts — left alone,
// they clutter the admin order list forever. When admin has configured a
// threshold (SiteSettings.autoCancelUnpaidDepositHours), sweep them into
// CANCELLED. Disabled entirely when the setting is null — admin cancels by
// hand in that case. Cheap to call on every admin order-list/dashboard
// render since the WHERE clause only ever matches genuinely stale rows.
//
// Plain COD orders (depositAmount = 0) are swept separately, on
// SiteSettings.autoCancelUnpaidCodHours — they never touch a payment
// gateway at all, so "abandoned" means "staff never confirmed it with the
// customer." This is also the backstop against checkout's stock decrement
// being abused: since checkout has no login requirement, a bot could
// otherwise place unlimited unpaid COD orders to drain a size's stock
// forever with nothing to cancel them.
export async function autoCancelStaleOrders(): Promise<void> {
  // getSiteSettings() is wrapped in React's cache() — reusing it here means
  // a page that also reads site settings elsewhere in the same request only
  // pays for one query instead of two.
  const settings = await getSiteSettings();
  const depositHours = settings?.autoCancelUnpaidDepositHours;
  const codHours = settings?.autoCancelUnpaidCodHours;

  const staleWhere: Prisma.OrderWhereInput[] = [];
  if (depositHours && depositHours > 0) {
    staleWhere.push({
      status: "PENDING",
      depositAmount: { gt: 0 },
      depositPaid: false,
      createdAt: { lt: new Date(Date.now() - depositHours * 60 * 60 * 1000) },
    });
  }
  if (codHours && codHours > 0) {
    staleWhere.push({
      status: "PENDING",
      paymentMethod: "COD",
      createdAt: { lt: new Date(Date.now() - codHours * 60 * 60 * 1000) },
    });
  }
  if (staleWhere.length === 0) return;

  const stale = await prisma.order.findMany({
    where: { OR: staleWhere },
    select: { id: true },
  });
  if (stale.length === 0) return;

  await prisma.$transaction(async (tx) => {
    // Restoring stock for each stale order still runs its own queries, but
    // concurrently instead of sequentially, and the status flip is one
    // updateMany for every stale order instead of one update per order.
    await Promise.all(stale.map(({ id }) => restoreOrderStock(tx, id)));
    await tx.order.updateMany({
      where: { id: { in: stale.map((o) => o.id) } },
      data: { status: "CANCELLED" },
    });
  });
}
