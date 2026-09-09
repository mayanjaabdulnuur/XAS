import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { subjectUpsertSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = subjectUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fix the highlighted fields" }, { status: 400 });
  }

  const subject = await prisma.subject.update({ where: { id: params.id }, data: parsed.data });

  await logAdminAction(admin, "SUBJECT_UPDATED", {
    targetType: "Subject",
    targetId: subject.id,
    metadata: { name: subject.name },
  });

  return NextResponse.json({ success: true, subject });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  try {
    const subject = await prisma.subject.delete({ where: { id: params.id } });
    await logAdminAction(admin, "SUBJECT_DELETED", {
      targetType: "Subject",
      targetId: subject.id,
      metadata: { name: subject.name },
    });
    return NextResponse.json({ success: true });
  } catch {
    // Document.subjectId is ON DELETE RESTRICT — deleting a subject that
    // still has documents fails at the DB level. Surface that plainly
    // instead of a generic 500.
    return NextResponse.json(
      { error: "This subject still has documents attached to it and can't be deleted." },
      { status: 409 }
    );
  }
}
