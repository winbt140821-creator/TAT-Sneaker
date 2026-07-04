import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// Memoized per request — the account layout and each account page both need
// the logged-in customer record, and React's cache() dedupes the DB hit
// across that single render pass instead of querying twice.
export const getCurrentCustomer = cache(async () => {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.customer.findUnique({ where: { email: session.user.email } });
});
