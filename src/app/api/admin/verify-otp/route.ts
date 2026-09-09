import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { adminOtpVerifySchema } from "@/lib/validation";
import { verifyCode } from "@/lib/password";
import { signAdminVerifiedToken, ADMIN_VERIFIED_COOKIE } from "@/lib/admin-verification";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit";

const MAX_ATTEMPTS = 5;
const GENERIC_INVALID = "That code is invalid or has expired. Request a new one.";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminOtpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }
  const { code } = parsed.data;

  const rl = await consumeRateLimit(`admin-otp-verify:${user.id}`, 8, 15 * 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const admin = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } });
  if (!admin) return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });

  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: admin.email,
      purpose: "ADMIN_PHONE_OTP",
      consumedAt: null,
      expires: { gt: new Date() },
    },
    orderBy: { expires: "desc" },
  });

  if (!token) {
    await logAdminAction(user, "ADMIN_LOGIN_FAILED", { metadata: { reason: "otp_not_found" } });
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }

  if (token.attempts >= MAX_ATTEMPTS) {
    await prisma.verificationToken.updateMany({
      where: { identifier: admin.email, token: token.token },
      data: { consumedAt: new Date() },
    });
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }

  const valid = await verifyCode(code, token.token);
  if (!valid) {
    await prisma.verificationToken.updateMany({
      where: { identifier: admin.email, token: token.token },
      data: { attempts: { increment: 1 } },
    });
    await logAdminAction(user, "ADMIN_LOGIN_FAILED", { metadata: { reason: "wrong_otp" } });
    return NextResponse.json({ error: GENERIC_INVALID }, { status: 400 });
  }

  await prisma.verificationToken.updateMany({
    where: { identifier: admin.email, token: token.token },
    data: { consumedAt: new Date() },
  });

  await logAdminAction(user, "ADMIN_LOGIN");

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_VERIFIED_COOKIE, signAdminVerifiedToken(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}
