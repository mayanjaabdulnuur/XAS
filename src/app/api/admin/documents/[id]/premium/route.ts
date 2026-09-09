import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (typeof body?.isPremium !== "boolean") {
    return NextResponse.json({ error: "isPremium must be true or false" }, { status: 400 });
  }

  const document = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.document.update({
      where: { id: params.id },
      data: { isPremium: body.isPremium },
      select: { id: true, title: true, isPremium: true },
    })
  );

  await logAdminAction(admin, "SETTINGS_CHANGED", {
    targetType: "Document",
    targetId: document.id,
    metadata: { action: "premium_toggle", title: document.title, isPremium: document.isPremium },
  });

  return NextResponse.json({ success: true, document });
}
