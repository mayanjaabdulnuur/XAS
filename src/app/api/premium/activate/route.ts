import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { hashPremiumCode } from "@/lib/premium-code";
import { premiumActivateSchema } from "@/lib/validation";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit";

const GENERIC_INVALID =
  "That code isn't valid. Please check it and try again, or contact an administrator on WhatsApp.";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to activate premium access" }, { status: 401 });
  }

  const rl = await consumeRateLimit(`premium-activate:${user.id}`, 5, 15 * 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = premiumActivateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }

  const codeHash = hashPremiumCode(parsed.data.code);

  const result = await withRlsContext({ userId: user.id, role: user.role }, async (tx) => {
    // A single equality lookup on the unique hash — no fetch-and-compare
    // loop (see src/lib/premium-code.ts for why that's safe here).
    const code = await tx.premiumCode.findUnique({ where: { codeHash } });

    if (!code) return { ok: false as const };

    // Deliberately don't distinguish "used" vs "revoked" vs "expired" vs
    // "wrong" in the response — all collapse to the same generic message,
    // same principle as the login/forgot-password flows.
    const isExpired = code.expiresAt ? code.expiresAt < new Date() : false;
    if (code.status !== "ACTIVE" || code.redeemedById || isExpired) {
      return { ok: false as const };
    }

    const premiumExpires = code.durationDays
      ? new Date(Date.now() + code.durationDays * 24 * 60 * 60 * 1000)
      : null;

    // First successful activation wins — the WHERE clause re-checks
    // status/redeemedById at the database level so two simultaneous
    // requests for the same code can't both succeed (the second one's
    // updateMany simply matches zero rows).
    const claim = await tx.premiumCode.updateMany({
      where: { id: code.id, status: "ACTIVE", redeemedById: null },
      data: { status: "USED", redeemedById: user.id, redeemedAt: new Date(), expiresAt: premiumExpires },
    });

    if (claim.count === 0) return { ok: false as const }; // lost a race to another request

    await tx.user.update({
      where: { id: user.id },
      data: { premiumStatus: true, premiumExpires },
    });

    return { ok: true as const, codeId: code.id };
  });

  if (!result.ok) {
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }

  // logAdminAction is reused here for a scholar's own self-service action,
  // not an admin acting on someone else — the AuditLog schema's `adminId`
  // field just records "who performed this," which is accurate either way,
  // and PREMIUM_ACTIVATED exists specifically for this event.
  await logAdminAction(user, "PREMIUM_ACTIVATED", {
    targetType: "PremiumCode",
    targetId: result.codeId,
  });

  return NextResponse.json({ success: true });
}
