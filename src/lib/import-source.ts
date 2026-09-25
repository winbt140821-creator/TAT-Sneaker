import { prisma } from "./db";
import { requireStaff } from "./auth";

/** The saved Yupoo shop an import request names, after checking the caller
 *  is staff. Null when either fails — route handlers answer 404/401. */
export async function staffImportSource(sourceId: string | null) {
  try {
    await requireStaff();
  } catch {
    return { error: "Unauthorized", status: 401 } as const;
  }
  const source = sourceId
    ? await prisma.importSource.findUnique({ where: { id: sourceId }, select: { owner: true, password: true } })
    : null;
  if (!source) return { error: "Không tìm thấy shop này. Tải lại trang.", status: 404 } as const;
  return { source } as const;
}
