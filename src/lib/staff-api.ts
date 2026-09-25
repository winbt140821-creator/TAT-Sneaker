import { requireStaff } from "./auth";

/** For admin route handlers: true when the caller is signed-in staff. */
export async function isStaffRequest(): Promise<boolean> {
  try {
    await requireStaff();
    return true;
  } catch {
    return false;
  }
}
