// Client for the Viettel Post Open API (partner2.viettelpost.vn).
//
// The real endpoint paths, auth flow, and request/response shapes are only
// published once Viettel Post approves a partner account — until then this
// module exposes the shape callers use (createShipment / getShipmentStatus)
// but throws ShippingNotConfiguredError so the rest of the app can be wired
// up ahead of time.
//
// To finish this integration once you have partner access:
//   1. Register: 0862 235 888 / b2b@viettelpost.com.vn, or
//      https://partner2.viettelpost.vn/
//   2. Set VIETTELPOST_USERNAME / VIETTELPOST_PASSWORD (or token, per their
//      docs) in .env.
//   3. Replace the TODO bodies below with real fetch calls per the docs
//      Viettel Post provides after registration.

import type { Order, OrderItem, Product } from "@/generated/prisma/client";

export class ShippingNotConfiguredError extends Error {
  constructor() {
    super(
      "Chưa cấu hình API Viettel Post. Đăng ký tài khoản đối tác tại partner2.viettelpost.vn " +
        "(hotline 0862 235 888 / b2b@viettelpost.com.vn), rồi điền VIETTELPOST_USERNAME và " +
        "VIETTELPOST_PASSWORD vào .env.",
    );
    this.name = "ShippingNotConfiguredError";
  }
}

type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] };

export interface CreateShipmentResult {
  trackingCode: string;
  status: string;
}

export interface ShipmentStatusResult {
  status: string;
  statusText: string;
}

function requireCredentials(): { username: string; password: string } {
  const username = process.env.VIETTELPOST_USERNAME;
  const password = process.env.VIETTELPOST_PASSWORD;
  if (!username || !password) throw new ShippingNotConfiguredError();
  return { username, password };
}

// TODO: call Viettel Post's "create order" endpoint with the real payload
// shape once partner API docs are available (see module comment above).
export async function createShipment(_order: OrderWithItems): Promise<CreateShipmentResult> {
  requireCredentials();
  throw new Error("createShipment: chưa triển khai — cần tài liệu API thật từ Viettel Post.");
}

// TODO: call Viettel Post's "order tracking" endpoint with the real payload
// shape once partner API docs are available (see module comment above).
export async function getShipmentStatus(_trackingCode: string): Promise<ShipmentStatusResult> {
  requireCredentials();
  throw new Error("getShipmentStatus: chưa triển khai — cần tài liệu API thật từ Viettel Post.");
}
