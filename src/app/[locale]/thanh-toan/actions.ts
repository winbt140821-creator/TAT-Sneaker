"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getActiveCampaigns, salePriceFor } from "@/lib/sale";
import { getSiteSettings } from "@/lib/settings";
import { auth } from "@/auth";
import { absoluteUrl } from "@/lib/seo";
import { createPaymentUrl } from "@/lib/payments/vnpay";
import { createOrder as createPaypalOrder } from "@/lib/payments/paypal";
import { sendCapiPurchase } from "@/lib/meta-capi";

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
  // Cart items come from the client (ultimately localStorage) — a negative
  // or non-integer quantity would pass `availableQty < item.quantity`
  // (making it false), then flow into the stock decrement as an INCREASE
  // and into the order total as a negative charge. Reject anything that
  // isn't a positive integer before it reaches stock math or pricing.
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { error: "Số lượng sản phẩm không hợp lệ." };
    }
  }

  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const [products, campaigns] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } } }),
    getActiveCampaigns(),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const priceFor = (productId: string, basePrice: number) =>
    salePriceFor(productId, basePrice, campaigns).price;

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
    return sum + priceFor(product.id, product.price) * item.quantity;
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

  // Snapshot which ad/campaign (if any) brought this customer in, captured
  // into a cookie by src/proxy.ts on whichever landing page they first
  // clicked through from — read once here and reused below for the CAPI fbc.
  const cookieStore = await cookies();
  let attribution: { utmSource?: string; utmMedium?: string; utmCampaign?: string; fbclid?: string } = {};
  try {
    attribution = JSON.parse(cookieStore.get("attribution")?.value ?? "{}");
  } catch {
    attribution = {};
  }

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Re-read and decrement stock inside the transaction (not from the
      // `byId` snapshot fetched above) — two checkouts for the last pair
      // arriving at nearly the same time must not both succeed just because
      // they both saw "1 in stock" before either wrote anything. Batched
      // into one findMany instead of a per-item findUnique, and one update
      // per distinct product (accumulating in-memory when the cart has two
      // sizes of the same product) instead of one per cart line.
      const freshProducts = await tx.product.findMany({ where: { id: { in: productIds } } });
      const freshById = new Map(freshProducts.map((p) => [p.id, p]));
      const pendingQuantities = new Map<string, Record<string, number>>();

      for (const item of input.items) {
        const product = freshById.get(item.productId);
        if (!product) throw new InsufficientStockError("Một sản phẩm trong giỏ không còn tồn tại.");

        const sizeQuantities =
          pendingQuantities.get(item.productId) ??
          (JSON.parse(product.sizeQuantities) as Record<string, number>);
        const key = String(item.size);
        const availableQty = sizeQuantities[key] ?? 0;
        if (availableQty < item.quantity) {
          throw new InsufficientStockError(
            `${product.name} size ${item.size} chỉ còn ${availableQty} đôi.`
          );
        }
        sizeQuantities[key] = availableQty - item.quantity;
        pendingQuantities.set(item.productId, sizeQuantities);
      }

      await Promise.all(
        [...pendingQuantities.entries()].map(([productId, sizeQuantities]) =>
          tx.product.update({
            where: { id: productId },
            data: { sizeQuantities: JSON.stringify(sizeQuantities) },
          })
        )
      );

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
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          fbclid: attribution.fbclid,
          items: {
            create: input.items.map((item) => {
              const product = byId.get(item.productId)!;
              const unitDeposit = product.depositRequired ? (product.depositAmount ?? 0) : 0;
              return {
                productId: item.productId,
                size: item.size,
                quantity: item.quantity,
                price: priceFor(product.id, product.price),
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

  const headersList = await headers();
  await sendCapiPurchase({
    orderCode: code,
    value: orderTotal,
    email: session.user.email,
    phone: customerPhone,
    clientIp: headersList.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: headersList.get("user-agent") ?? undefined,
    fbp: cookieStore.get("_fbp")?.value,
    fbc: cookieStore.get("_fbc")?.value,
    eventSourceUrl: absoluteUrl(`/don-hang/${code}`),
  });

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
  const settings = await getSiteSettings();
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
