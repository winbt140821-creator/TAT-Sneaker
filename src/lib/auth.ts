import { cache } from "react";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const SESSION_COOKIE_NAME = "cop_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Proxy-safe: takes a raw token string instead of reading next/headers. */
export async function getStaffByToken(token: string | undefined) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { staff: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.staff;
}

/** Runs on every /admin request in proxy.ts — only needs enough to decide
 *  "logged in?" and "is this the /admin/staff-only area?", so it selects just
 *  role instead of pulling the full Staff row (name, password hash, etc.)
 *  that only the actual page render needs via the cache()-wrapped
 *  getCurrentStaff() above. */
export async function getStaffRoleByToken(token: string | undefined) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, staff: { select: { role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.staff;
}

export async function createSession(staffId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { token, staffId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  store.delete(SESSION_COOKIE_NAME);
}

/** Call whenever a staff member's password changes — otherwise a session
 * token issued before the change (e.g. one an attacker already holds)
 * keeps working for up to 7 more days regardless of the new password. */
export async function invalidateStaffSessions(staffId: string) {
  await prisma.session.deleteMany({ where: { staffId } });
}

// Wrapped in React's cache() so the several places that independently need
// the current staff on one request (protected layout, Header's "QUẢN LÝ"
// link check, any page/action that also calls requireStaff()) share a
// single session lookup instead of each hitting the database on their own.
export const getCurrentStaff = cache(async () => {
  const store = await cookies();
  return getStaffByToken(store.get(SESSION_COOKIE_NAME)?.value);
});

export async function requireStaff() {
  const staff = await getCurrentStaff();
  if (!staff) throw new Error("UNAUTHENTICATED");
  return staff;
}

export async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.role !== "ADMIN") throw new Error("FORBIDDEN");
  return staff;
}
