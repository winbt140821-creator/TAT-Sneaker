import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { captureOrder } from "@/lib/payments/paypal";

// Browser return after the customer approves payment on PayPal
// (PayPal redirects here with ?token=<paypalOrderId>). Captures the order
// synchronously — see paypal/webhook/route.ts for the async source of
// truth if the customer closes the tab before this completes.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/", request.url));

  const payment = await prisma.payment.findFirst({
    where: { provider: "PAYPAL", providerRef: token },
    include: { order: true },
  });
  if (!payment) return NextResponse.redirect(new URL("/", request.url));

  try {
    if (payment.status === "PENDING") {
      const result = await captureOrder(token);
      const succeeded = result.status === "COMPLETED";
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: succeeded ? "SUCCEEDED" : "FAILED",
          providerTxnId: result.captureId,
          providerRawStatus: result.status,
        },
      });
      if (succeeded) {
        await prisma.order.update({ where: { id: payment.orderId }, data: { depositPaid: true } });
      }
    }
  } catch {
    // Gateway not configured yet — leave the payment PENDING. The webhook
    // handler (once configured) is what actually confirms status.
  }

  return NextResponse.redirect(new URL(`/don-hang/${payment.order.code}`, request.url));
}
