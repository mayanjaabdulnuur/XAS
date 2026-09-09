import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { passwordChangeSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return NextResponse.json({ error: "You must be logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "This account signed up with Google and has no password to change yet." },
      { status: 400 }
    );
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: sessionUser.id }, data: { passwordHash: newHash } });

  // Note: sessions here use NextAuth's JWT strategy, not database-backed
  // sessions, so there's no server-side session row to revoke the way
  // reset-password.ts does — a JWT stays valid until it naturally expires
  // regardless of a password change. That's an accepted limitation of the
  // JWT strategy rather than something this endpoint can fix on its own.

  return NextResponse.json({ success: true });
}
