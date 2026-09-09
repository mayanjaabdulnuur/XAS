import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const code = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.premiumCode.findUnique({ where: { id: params.id } })
  );
  if (!code) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }

  await withRlsContext({ userId: user.id, role: user.role }, async (tx) => {
    await tx.premiumCode.update({
      where: { id: params.id },
      data: { status: "REVOKED", revokedAt: new Date(), revokedReason: "Revoked by administrator" },
    });

    // If the code had already been redeemed, revoking it also pulls
    // premium access from whoever activated it — codes and access are
    // meant to stay linked, per the spec's "revoke access codes/accounts
    // involved in abuse" requirement.
    if (code.redeemedById) {
      await tx.user.update({
        where: { id: code.redeemedById },
        data: { premiumStatus: false, premiumExpires: null },
      });
    }
  });

  await logAdminAction(user, "PREMIUM_CODE_REVOKED", {
    targetType: "PremiumCode",
    targetId: params.id,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ success: true });
}
