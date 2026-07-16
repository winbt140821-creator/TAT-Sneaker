"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export type OrderLookupResult = { error?: string; code?: string };

// Guest orders (no account, see thanh-toan/actions.ts createOrderAction)
// have no order-history page to find them again — this is their only way
// back if they lose the confirmation link. Only ever resolves orders that
// were actually placed as a guest (customerId null); an order tied to a
// real account still requires logging in on /don-hang/[code], so this form
// can't be used to bypass that.
export async function lookupGuestOrderAction(input: {
  code: string;
  email: string;
}): Promise<OrderLookupResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`lookupOrder:${ip}`, 10, 10 * 60 * 1000)) {
    return { error: "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút." };
  }

  const code = input.code.trim().toUpperCase();
  const email = input.email.trim().toLowerCase();
  if (!code || !email) {
    return { error: "Vui lòng nhập đầy đủ mã đơn và email." };
  }

  const order = await prisma.order.findUnique({
    where: { code },
    select: { code: true, email: true, customerId: true },
  });

  const NOT_FOUND = { error: "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và email." };
  if (!order || order.customerId || !order.email) return NOT_FOUND;
  if (order.email.toLowerCase() !== email) return NOT_FOUND;

  return { code: order.code };
}
