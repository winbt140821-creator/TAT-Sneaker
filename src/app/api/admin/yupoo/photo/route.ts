import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { staffImportSource } from "@/lib/import-source";
import { importYupooPhoto } from "@/lib/import-photo";
import { YupooError } from "@/lib/yupoo";

// Copies one supplier photo into our storage. One photo per request (the
// import screen runs a few at once) keeps each call short and lets the
// screen show progress photo by photo.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { source?: string; url?: string } | null;
  const auth = await staffImportSource(body?.source ?? null);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const url = await importYupooPhoto(auth.source.owner, String(body?.url ?? ""));
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof YupooError ? err.message : "Không xử lý được ảnh này.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
