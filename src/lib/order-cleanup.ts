import { prisma } from "@/lib/db";

// Orders that require a deposit (per-product rule or "pay in full" choice)
// but never get it paid are effectively abandoned checkouts — left alone,
// they clutter the admin order list forever. When admin has configured a
// threshold (SiteSettings.autoCancelUnpaidDepositHours), sweep them into
// CANCELLED. Disabled entirely when the setting is null — admin cancels by
// hand in that case. Cheap to call on every admin order-list/dashboard
// render since the WHERE clause only ever matches genuinely stale rows.
export async function autoCancelStaleOrders(): Promise<void> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  const hours = settings?.autoCancelUnpaidDepositHours;
  if (!hours || hours <= 0) return;

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  await prisma.order.updateMany({
    where: {
      status: "PENDING",
      depositAmount: { gt: 0 },
      depositPaid: false,
      createdAt: { lt: cutoff },
    },
    data: { status: "CANCELLED" },
  });
}
