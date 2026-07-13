import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/auth";

// Tiny, separate endpoint so Header (rendered on every customer page) can
// show/hide the "QUẢN LÝ" admin link without the page itself calling
// getCurrentStaff() (which reads cookies() and would force every customer
// page to skip static rendering/caching just for this one staff-only link).
export async function GET() {
  const staff = await getCurrentStaff();
  return NextResponse.json(
    { isStaff: Boolean(staff) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
