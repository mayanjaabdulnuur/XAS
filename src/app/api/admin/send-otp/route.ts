import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { generateNumericCode, hashCode } from "@/lib/password";
import { sendAdminOtpSms } from "@/lib/sms";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phoneNumber: true, email: true },
  });

  if (!admin?.phoneNumber) {
    return NextResponse.json(
      { error: "No phone number is on file for this admin account. Set one before continuing." },
      { status: 400 }
    );
  }

  const rl = await consumeRateLimit(`admin-otp-send:${user.id}`, 5, 15 * 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many code requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const code = generateNumericCode();
  const codeHash = await hashCode(code);
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.$transaction([
    prisma.verificationToken.updateMany({
      where: { identifier: admin.email, purpose: "ADMIN_PHONE_OTP", consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.verificationToken.create({
      data: { identifier: admin.email, token: codeHash, purpose: "ADMIN_PHONE_OTP", expires },
    }),
  ]);

  await sendAdminOtpSms(admin.phoneNumber, code);

  const masked = admin.phoneNumber.replace(/\d(?=\d{2})/g, "•");
  return NextResponse.json({ message: `Code sent to ${masked}` });
}
