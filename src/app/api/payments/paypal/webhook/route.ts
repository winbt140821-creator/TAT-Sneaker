import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments/paypal";

// PayPal's async webhook — the real source of truth for capture status
// (the browser /capture redirect alone isn't trustworthy).
//
// TODO: confirm the exact event payload shape once a real PayPal REST app +
// webhook is configured; the shape below follows PayPal's documented
// Orders v2 event conventions (resource.id / event_type).
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

  let event: { event_type?: string; resource?: { id?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const paypalOrderId = event.resource?.id;
  if (!paypalOrderId) return NextResponse.json({ received: true });

  const payment = await prisma.payment.findFirst({
    where: { provider: "PAYPAL", providerRef: paypalOrderId },
  });
  if (!payment || payment.status !== "PENDING") return NextResponse.json({ received: true });

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCEEDED", providerRawStatus: event.event_type },
    });
    await prisma.order.update({ where: { id: payment.orderId }, data: { depositPaid: true } });
  }

  return NextResponse.json({ received: true });
}
