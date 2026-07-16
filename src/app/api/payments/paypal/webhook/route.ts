import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments/paypal";

// PayPal's async webhook — the real source of truth for capture status
// (the browser /capture redirect alone isn't trustworthy).
export async function POST(request: NextRequest) {
  const body = await request.text();

  let verified: boolean;
  try {
    verified = await verifyWebhookSignature(request.headers, body);
  } catch {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  if (!verified) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  let event: {
    event_type?: string;
    resource?: {
      id?: string;
      supplementary_data?: { related_ids?: { order_id?: string } };
    };
  };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // On PAYMENT.CAPTURE.* events resource.id is the CAPTURE id — the PayPal
  // order id (what we store as providerRef) lives in supplementary_data.
  // On CHECKOUT.ORDER.* events resource.id is the order id itself.
  const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id ?? event.resource?.id;
  if (!paypalOrderId) return NextResponse.json({ received: true });

  const payment = await prisma.payment.findFirst({
    where: { provider: "PAYPAL", providerRef: paypalOrderId },
  });
  if (!payment || payment.status !== "PENDING") return NextResponse.json({ received: true });

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        providerRawStatus: event.event_type,
        providerTxnId: event.resource?.id,
      },
    });
    await prisma.order.update({ where: { id: payment.orderId }, data: { depositPaid: true } });
  }

  return NextResponse.json({ received: true });
}
