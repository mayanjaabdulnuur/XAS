import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { forgotPasswordSchema } from "@/lib/validation";
import { generateNumericCode, hashCode } from "@/lib/password";
import { sendPasswordResetCodeEmail } from "@/lib/mailer";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

// Always the same response shape/timing-insensitive message, regardless of
// whether the email exists — this is the whole point of the endpoint.
const GENERIC_MESSAGE =
  "If that email is registered with XAS, a reset code has been sent to it.";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Even validation errors get the generic message for the email field,
    // to avoid distinguishing "malformed" from "not found".
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
  const { email } = parsed.data;

  // Rate limit per-email AND per-IP so neither a single account nor a
  // single client can be hammered or used to hammer others.
  const perEmail = await consumeRateLimit(`forgot-password:email:${email}`, 3, 15 * 60);
  const perIp = await consumeRateLimit(`forgot-password:ip:${ip}`, 10, 15 * 60);
  if (!perEmail.allowed || !perIp.allowed) {
    // Still generic — do not reveal that rate limiting is what happened,
    // and do not leak which of the two limits triggered.
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && !user.isSuspended) {
    const code = generateNumericCode();
    const codeHash = await hashCode(code);
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.$transaction([
      // Invalidate any still-live codes for this email first, so only the
      // most recent one is ever valid.
      prisma.verificationToken.updateMany({
        where: { identifier: email, purpose: "PASSWORD_RESET", consumedAt: null },
        data: { consumedAt: new Date() },
      }),
      prisma.verificationToken.create({
        data: {
          identifier: email,
          token: codeHash,
          purpose: "PASSWORD_RESET",
          expires,
        },
      }),
    ]);

    await sendPasswordResetCodeEmail(email, code);
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
