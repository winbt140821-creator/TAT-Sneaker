"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { absoluteUrl } from "@/lib/seo";
import { createPaymentUrl } from "@/lib/payments/vnpay";
import { createOrder as createPaypalOrder } from "@/lib/payments/paypal";

// Thrown from inside the $transaction below to abort it and surface a normal
// { error } result — the outer catch converts it, since Prisma's interactive
// transaction just rethrows whatever the callback throws.
class InsufficientStockError extends Error {}

export type CheckoutItem = { productId: string; size: number; quantity: number };
// "COD" means nothing is charged upfront — used only when no per-product
// deposit is required AND the customer didn't choose to pay in full online.
// Any other value means that provider was used to collect whatever amountDue
// works out to be (just the deposit, or the full order if payInFull).
export type PaymentMethod = "COD" | "VNPAY" | "PAYPAL" | "BANK_TRANSFER";
export type CheckoutInput = {
  customerName: string;
  customerPhone: string;
  province: string;
  ward: string;
  address: string;
  note?: string;
  items: CheckoutItem[];
  paymentMethod: PaymentMethod;
  payInFull: boolean;
};
export type CheckoutResult = { error?: string; id?: string; code?: string; amountDue?: number };

export async function createOrderAction(input: CheckoutInput): Promise<CheckoutResult> {
  const customerName = input.customerName.trim();
  const customerPhone = input.customerPhone.trim();
  const province = input.province.trim();
  const ward = input.ward.trim();
  const address = input.address.trim();

  if (!customerName || !customerPhone || !province || !ward || !address) {
    return { error: "Vui lòng nhập đầy đủ thông tin giao hàng." };
  }
  if (input.items.length === 0) {
    return { error: "Giỏ hàng trống." };
  }

  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) return { error: "Một sản phẩm trong giỏ không còn tồn tại." };
    const sizeQuantities = JSON.parse(product.sizeQuantities) as Record<string, number>;
    const availableQty = sizeQuantities[String(item.size)] ?? 0;
    if (availableQty < item.quantity) {
      return { error: `${product.name} size ${item.size} chỉ còn ${availableQty} đôi.` };
    }
  }

  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Vui lòng đăng nhập để đặt hàng." };
  }
  const customer = await prisma.customer.findUnique({ where: { email: session.user.email } });
  if (!customer) {
    return { error: "Vui lòng đăng nhập để đặt hàng." };
  }

  // Timestamp keeps codes roughly chronological for admins; the random
  // suffix (~30 bits) is what actually prevents guessing — Date.now() alone
  // has no real entropy and made order codes enumerable.
  const code = `CH${Date.now().toString(36).toUpperCase()}${randomBytes(4).toString("hex").toUpperCase()}`;

  const orderTotal = input.items.reduce((sum, item) => {
    const product = byId.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  const productDeposit = input.items.reduce((sum, item) => {
    const product = byId.get(item.productId)!;
    const unitDeposit = product.depositRequired ? (product.depositAmount ?? 0) : 0;
    return sum + unitDeposit * item.quantity;
  }, 0);

  // Paying in full online always covers any per-product deposit requirement
  // too; otherwise the amount due upfront is whatever deposit is required
  // (0 if none), with the rest due on delivery.
  const amountDue = input.payInFull ? orderTotal : productDeposit;

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Re-read and decrement stock inside the transaction (not from the
      // `byId` snapshot fetched above) — two checkouts for the last pair
      // arriving at nearly the same time must not both succeed just because
      // they both saw "1 in stock" before either wrote anything.
      for (const item of input.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new InsufficientStockError("Một sản phẩm trong giỏ không còn tồn tại.");

        const sizeQuantities = JSON.parse(product.sizeQuantities) as Record<string, number>;
        const key = String(item.size);
        const availableQty = sizeQuantities[key] ?? 0;
        if (availableQty < item.quantity) {
          throw new InsufficientStockError(
            `${product.name} size ${item.size} chỉ còn ${availableQty} đôi.`
          );
        }

        sizeQuantities[key] = availableQty - item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: { sizeQuantities: JSON.stringify(sizeQuantities) },
        });
      }

      return tx.order.create({
        data: {
          code,
          customerName,
          customerPhone,
          province,
          ward,
          address,
          note: input.note?.trim() || null,
          customerId: customer.id,
          paymentMethod: input.paymentMethod,
          depositAmount: amountDue,
          items: {
            create: input.items.map((item) => {
              const product = byId.get(item.productId)!;
              const unitDeposit = product.depositRequired ? (product.depositAmount ?? 0) : 0;
              return {
                productId: item.productId,
                size: item.size,
                quantity: item.quantity,
                price: product.price,
                costPrice: product.costPrice ?? 0,
                depositAmount: unitDeposit,
              };
            }),
          },
        },
      });
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) return { error: err.message };
    throw err;
  }

  revalidatePath("/");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/products");

  return { id: order.id, code, amountDue };
}

export type PaymentProviderChoice = "VNPAY" | "PAYPAL" | "BANK_TRANSFER";
export type InitiatePaymentResult = { error?: string; redirectUrl?: string };

function isNotConfiguredError(err: unknown): err is Error {
  return err instanceof Error && err.name === "PaymentNotConfiguredError";
}

// Called after createOrderAction, whenever amountDue > 0 (a required deposit,
// or the customer chose to pay the full order online) — redirects the
// browser to the gateway's hosted checkout, or for BANK_TRANSFER just
// records the intent (nothing to redirect to; the customer completes the
// transfer manually using the bank info already shown on the confirmation
// page, and staff confirms receipt by hand). Falls back to a friendly error
// (checkout UI offers the manual-QR flow instead) until real VNPay/PayPal
// credentials are configured.
export async function initiatePaymentAction(
  orderId: string,
  provider: PaymentProviderChoice,
): Promise<InitiatePaymentResult> {
  const session = await auth();
  if (!session?.user?.email) return { error: "Vui lòng đăng nhập để đặt hàng." };

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: true } });
  if (!order) return { error: "Không tìm thấy đơn hàng." };
  // orderId comes straight from the client — without this check anyone
  // could initiate (and create Payment rows against) someone else's order.
  if (order.customer?.email !== session.user.email) {
    return { error: "Không tìm thấy đơn hàng." };
  }
  if (order.depositAmount <= 0) return { error: "Đơn hàng này không cần thanh toán trước." };
  if (order.depositPaid) return { error: "Đơn hàng đã được thanh toán." };

  if (provider === "BANK_TRANSFER") {
    await prisma.payment.create({
      data: {
        orderId,
        provider: "BANK_TRANSFER",
        status: "PENDING",
        amount: order.depositAmount,
        currency: "VND",
      },
    });
    return {};
  }

  if (provider === "VNPAY") {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    let result;
    try {
      result = await createPaymentUrl({
        orderCode: order.code,
        amountVnd: order.depositAmount,
        returnUrl: absoluteUrl("/api/payments/vnpay/return"),
        ipAddress: ip,
        orderInfo: `Thanh toán đơn hàng ${order.code}`,
      });
    } catch (err) {
      if (isNotConfiguredError(err)) return { error: err.message };
      throw err;
    }

    await prisma.payment.create({
      data: {
        orderId,
        provider: "VNPAY",
        status: "PENDING",
        amount: order.depositAmount,
        currency: "VND",
        providerRef: result.txnRef,
      },
    });

    return { redirectUrl: result.paymentUrl };
  }

  // PAYPAL (also used for the Visa/Mastercard card-only checkout option)
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  const rate = settings?.usdExchangeRate;
  if (!rate) {
    return { error: "Chưa cấu hình tỷ giá USD trong Cài đặt. Vui lòng liên hệ quản trị viên." };
  }

  const amountUsdCents = Math.round((order.depositAmount / rate) * 100);

  let result;
  try {
    result = await createPaypalOrder({
      orderCode: order.code,
      amountUsd: amountUsdCents,
      returnUrl: absoluteUrl(`/api/payments/paypal/capture`),
      cancelUrl: absoluteUrl(`/don-hang/${order.code}`),
    });
  } catch (err) {
    if (isNotConfiguredError(err)) return { error: err.message };
    throw err;
  }

  await prisma.payment.create({
    data: {
      orderId,
      provider: "PAYPAL",
      status: "PENDING",
      amount: amountUsdCents,
      currency: "USD",
      providerRef: result.paypalOrderId,
    },
  });

  return { redirectUrl: result.approveUrl };
}
