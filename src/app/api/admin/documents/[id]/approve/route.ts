import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const document = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.document.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        rejectionNote: null,
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
      select: { id: true, title: true },
    })
  );

  await logAdminAction(admin, "DOCUMENT_APPROVED", {
    targetType: "Document",
    targetId: document.id,
    metadata: { title: document.title },
  });

  return NextResponse.json({ success: true });
}
