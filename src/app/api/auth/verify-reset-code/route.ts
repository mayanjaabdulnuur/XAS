import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { verifyResetCodeSchema } from "@/lib/validation";
import { verifyCode } from "@/lib/password";
import { signResetToken } from "@/lib/reset-token";
import { consumeRateLimit } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
const GENERIC_INVALID = "That code is invalid or has expired. Request a new one.";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = verifyResetCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }
  const { email, code } = parsed.data;

  const rl = await consumeRateLimit(`verify-reset-code:${email}`, 8, 15 * 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      purpose: "PASSWORD_RESET",
      consumedAt: null,
      expires: { gt: new Date() },
    },
    orderBy: { expires: "desc" },
  });

  if (!token) {
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }

  if (token.attempts >= MAX_ATTEMPTS) {
    // Lock this code out entirely once too many wrong guesses have been
    // made against it, even if it hasn't technically expired yet.
    await prisma.verificationToken.updateMany({
      where: { identifier: email, token: token.token },
      data: { consumedAt: new Date() },
    });
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }

  const valid = await verifyCode(code, token.token);

  if (!valid) {
    await prisma.verificationToken.updateMany({
      where: { identifier: email, token: token.token },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }

  // One-time use: mark consumed immediately on success so this exact code
  // can never be replayed, even within its expiry window.
  await prisma.verificationToken.updateMany({
    where: { identifier: email, token: token.token },
    data: { consumedAt: new Date() },
  });

  const resetToken = signResetToken(email);
  return NextResponse.json({ resetToken });
}
