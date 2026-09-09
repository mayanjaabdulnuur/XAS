import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { verifyAdminVerifiedToken, ADMIN_VERIFIED_COOKIE } from "@/lib/admin-verification";
import { cookies } from "next/headers";
import { logAdminAction } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: { commentId: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  // An ADMIN role alone isn't enough to delete someone else's comment —
  // that additionally requires the phone-OTP-verified cookie, same
  // standard as every other admin action. A logged-in admin who hasn't
  // completed that step can still delete only their own comments, same as
  // any scholar.
  const isVerifiedAdmin =
    user.role === "ADMIN" && verifyAdminVerifiedToken(cookies().get(ADMIN_VERIFIED_COOKIE)?.value, user.id);

  const where = isVerifiedAdmin
    ? { id: params.commentId }
    : { id: params.commentId, userId: user.id };

  const result = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.comment.updateMany({ where, data: { isRemoved: true } })
  );

  if (result.count === 0) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (isVerifiedAdmin) {
    await logAdminAction(user, "COMMENT_DELETED", { targetType: "Comment", targetId: params.commentId });
  }

  return NextResponse.json({ success: true });
}
