import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { resolveStoredPath } from "@/lib/storage";
import { logAdminAction } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const document = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.document.delete({
      where: { id: params.id },
      select: { id: true, title: true, filePath: true, thumbnailPath: true },
    })
  );

  // Best-effort file cleanup — the DB row is already gone regardless of
  // whether the underlying file happens to be missing already.
  try {
    await unlink(resolveStoredPath(document.filePath));
  } catch {
    // ignore — file may already be gone
  }
  if (document.thumbnailPath) {
    try {
      await unlink(resolveStoredPath(document.thumbnailPath));
    } catch {
      // ignore
    }
  }

  await logAdminAction(admin, "DOCUMENT_DELETED", {
    targetType: "Document",
    targetId: document.id,
    metadata: { title: document.title, mode: "hard_delete" },
  });

  return NextResponse.json({ success: true });
}
