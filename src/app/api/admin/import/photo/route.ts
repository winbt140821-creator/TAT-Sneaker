import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isStaffRequest } from "@/lib/staff-api";
import { importWebPhoto, ImportPhotoError } from "@/lib/import-photo";
import { SafeFetchError } from "@/lib/safe-fetch";

// Copies one photo from any site into our storage (one per request, like
// the Yupoo one, so the import screen can run a few at once).
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isStaffRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { url?: string; referer?: string } | null;
  const referer = typeof body?.referer === "string" && /^https?:\/\//.test(body.referer) ? body.referer : undefined;

  try {
    const url = await importWebPhoto(String(body?.url ?? ""), referer);
    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof ImportPhotoError || err instanceof SafeFetchError ? err.message : "Không xử lý được ảnh này.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
