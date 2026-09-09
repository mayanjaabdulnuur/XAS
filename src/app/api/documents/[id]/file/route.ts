import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { resolveStoredPath } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to view documents" }, { status: 401 });
  }

  const document = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.document.findUnique({ where: { id: params.id } })
  );
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const isOwner = document.uploaderId === user.id;
  const isAdmin = user.role === "ADMIN";

  // Pending/rejected/removed documents are only ever visible to their
  // uploader (to check status) or an admin — never to other scholars.
  if (document.status !== "APPROVED" && !isOwner && !isAdmin) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.isPremium && !isAdmin && !isOwner) {
    // Always re-check premium status from the DB, never trust a cached
    // session claim — premium can be revoked mid-session.
    const freshUser = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
      tx.user.findUnique({
        where: { id: user.id },
        select: { premiumStatus: true, premiumExpires: true },
      })
    );
    const stillActive =
      freshUser?.premiumStatus && (!freshUser.premiumExpires || freshUser.premiumExpires > new Date());
    if (!stillActive) {
      return NextResponse.json(
        {
          error:
            "This is a premium document. Activate premium access to view it, or contact an administrator.",
        },
        { status: 403 }
      );
    }
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "download" ? "download" : "view";

  let buffer: Buffer;
  try {
    buffer = await readFile(resolveStoredPath(document.filePath));
  } catch {
    return NextResponse.json({ error: "File is unavailable" }, { status: 404 });
  }

  // Only count real reads of an approved document, not the uploader
  // repeatedly checking their own pending upload. Wrapped in the RLS
  // context so the "any authenticated user may update an approved
  // document's counters" policy in prisma/rls.sql actually applies.
  if (document.status === "APPROVED") {
    await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
      tx.document.update({
        where: { id: document.id },
        data: mode === "download" ? { downloadCount: { increment: 1 } } : { viewCount: { increment: 1 } },
      })
    );
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `${mode === "download" ? "attachment" : "inline"}; filename="${encodeURIComponent(
        document.originalFilename
      )}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
