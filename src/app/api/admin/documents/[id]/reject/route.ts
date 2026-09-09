import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { documentRejectSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = documentRejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Give a reason for rejecting this document" }, { status: 400 });
  }

  const document = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.document.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        rejectionNote: parsed.data.reason,
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
      select: { id: true, title: true },
    })
  );

  await logAdminAction(admin, "DOCUMENT_REJECTED", {
    targetType: "Document",
    targetId: document.id,
    metadata: { title: document.title, reason: parsed.data.reason },
  });

  return NextResponse.json({ success: true });
}
