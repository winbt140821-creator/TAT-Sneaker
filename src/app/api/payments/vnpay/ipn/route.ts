import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyIpnSignature } from "@/lib/payments/vnpay";

// VNPay's server-to-server IPN (Instant Payment Notification) — the actual
// source of truth for payment status, since the browser /return redirect
// alone can be spoofed or missed if the customer closes the tab.
//
// TODO: confirm the exact RspCode/Message response contract VNPay expects
// once real API docs are available (provided after merchant registration);
// the shape below follows VNPay's commonly documented convention.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const txnRef = params.get("vnp_TxnRef");
  if (!txnRef) {
    return NextResponse.json({ RspCode: "01", Message: "Order not found" });
  }

  const payment = await prisma.payment.findFirst({
    where: { provider: "VNPAY", providerRef: txnRef },
  });
  if (!payment) {
    return NextResponse.json({ RspCode: "01", Message: "Order not found" });
  }

  let verified: boolean;
  try {
    verified = verifyIpnSignature(params);
  } catch {
    return NextResponse.json({ RspCode: "99", Message: "Payment gateway not configured" });
  }

  if (!verified) {
    return NextResponse.json({ RspCode: "97", Message: "Invalid signature" });
  }

  if (payment.status === "PENDING") {
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

  return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
}
