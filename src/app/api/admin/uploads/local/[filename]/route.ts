import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireStaff } from "@/lib/auth";
import { detectImageExt, saveToLocalDisk, MAX_FILE_BYTES } from "@/lib/uploads";

// Only hit in local dev when R2 env vars aren't set (see createUploadTargets
// in src/lib/uploads.ts) — production always uploads straight to R2 via a
// presigned URL instead of through this route.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await params;
  const buffer = Buffer.from(await request.arrayBuffer());

  if (buffer.length === 0 || buffer.length > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
  }
  if (!detectImageExt(buffer)) {
    return NextResponse.json({ error: "Not a real image file" }, { status: 400 });
  }

  await saveToLocalDisk(filename, buffer);
  return NextResponse.json({ ok: true });
}
