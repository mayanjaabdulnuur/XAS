import { NextResponse } from "next/server";
import { prisma, withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { premiumStatus: false, premiumExpires: null },
    select: { id: true, email: true },
  });

  await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.premiumCode.updateMany({
      where: { redeemedById: user.id, status: "USED" },
      data: { status: "REVOKED", revokedAt: new Date(), revokedReason: "Revoked by administrator" },
    })
  );

  await logAdminAction(admin, "PREMIUM_CODE_REVOKED", {
    targetType: "User",
    targetId: user.id,
    metadata: { email: user.email, mode: "revoked_via_user" },
  });

  return NextResponse.json({ success: true });
}
