import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { resetPasswordSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { verifyResetToken } from "@/lib/reset-token";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { resetToken, password } = parsed.data;

  const email = verifyResetToken(resetToken);
  if (!email) {
    return NextResponse.json(
      { error: "This reset link has expired. Please start again." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Token was valid but the account is gone — treat identically to an
    // expired token rather than confirming account non-existence.
    return NextResponse.json(
      { error: "This reset link has expired. Please start again." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Note: sessions here use NextAuth's JWT strategy, so there's no
  // database-backed session row to revoke — a previously-issued JWT
  // remains valid until it naturally expires, regardless of this reset.
  // (An earlier version of this comment claimed a `Session` table delete
  // here invalidated other sessions; under the JWT strategy that call
  // always affected zero rows, so it's been removed rather than left as
  // dead code implying a guarantee that wasn't real.)

  return NextResponse.json({ success: true });
}
