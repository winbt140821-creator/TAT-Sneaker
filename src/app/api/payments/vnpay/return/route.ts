import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyReturnSignature } from "@/lib/payments/vnpay";

// Browser return redirect after the customer pays (or cancels) on VNPay's
// hosted page. Not trustworthy alone — see vnpay/ipn/route.ts, VNPay's
// server-to-server callback, for the real source of truth. This handler
// just gives the customer a fast redirect back to their order.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const txnRef = params.get("vnp_TxnRef");
  if (!txnRef) return NextResponse.redirect(new URL("/", request.url));

  const payment = await prisma.payment.findFirst({
    where: { provider: "VNPAY", providerRef: txnRef },
    include: { order: true },
  });
  if (!payment) return NextResponse.redirect(new URL("/", request.url));

  try {
    if (verifyReturnSignature(params) && payment.status === "PENDING") {
      const responseCode = params.get("vnp_ResponseCode");
      const succeeded = responseCode === "00";
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: succeeded ? "SUCCEEDED" : "FAILED",
          providerTxnId: params.get("vnp_TransactionNo") ?? undefined,
          providerRawStatus: responseCode ?? undefined,
        },
      });
      if (succeeded) {
        await prisma.order.update({ where: { id: payment.orderId }, data: { depositPaid: true } });
      }
    }
  } catch {
    // Gateway not configured yet — leave the payment PENDING. The IPN
    // handler (once configured) is what actually confirms status.
  }

  return NextResponse.redirect(new URL(`/don-hang/${payment.order.code}`, request.url));
}
