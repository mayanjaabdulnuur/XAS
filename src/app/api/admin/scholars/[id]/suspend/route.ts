import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (typeof body?.suspend !== "boolean") {
    return NextResponse.json({ error: "suspend must be true or false" }, { status: 400 });
  }

  const scholar = await prisma.user.update({
    where: { id: params.id },
    data: { isSuspended: body.suspend },
    select: { id: true, email: true },
  });

  await logAdminAction(admin, body.suspend ? "USER_SUSPENDED" : "USER_UNSUSPENDED", {
    targetType: "User",
    targetId: scholar.id,
    metadata: { email: scholar.email },
  });

  return NextResponse.json({ success: true });
}
