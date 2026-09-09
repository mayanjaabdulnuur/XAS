import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { generatePremiumCode, hashPremiumCode, maskPremiumCode } from "@/lib/premium-code";
import { premiumCodeCreateSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = premiumCodeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const durationDays = parsed.data.durationDays === "none" ? null : parsed.data.durationDays;
  const code = generatePremiumCode();
  const codeHash = hashPremiumCode(code);

  const created = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.premiumCode.create({
      data: {
        codeHash,
        label: maskPremiumCode(code),
        durationDays,
        createdById: user.id,
      },
      select: { id: true, label: true, durationDays: true, createdAt: true },
    })
  );

  await logAdminAction(user, "PREMIUM_CODE_CREATED", {
    targetType: "PremiumCode",
    targetId: created.id,
    metadata: { durationDays },
    ipAddress: getClientIp(req),
  });

  // The plaintext code is returned ONLY in this response, right after
  // creation — it is never stored anywhere and can never be retrieved
  // again. The admin must copy it now to hand to the scholar.
  return NextResponse.json({ code, ...created }, { status: 201 });
}

export async function GET() {
  const user = await getVerifiedAdmin();
  if (!user) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const codes = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.premiumCode.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        status: true,
        durationDays: true,
        createdAt: true,
        expiresAt: true,
        redeemedAt: true,
        redeemedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    })
  );

  return NextResponse.json({ codes });
}
