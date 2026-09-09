import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { subjectUpsertSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit";

export async function GET() {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const subjects = await prisma.subject.findMany({ orderBy: [{ level: "asc" }, { name: "asc" }] });
  return NextResponse.json({ subjects });
}

export async function POST(req: Request) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = subjectUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fix the highlighted fields" }, { status: 400 });
  }

  const existing = await prisma.subject.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "A subject with that slug already exists" }, { status: 409 });
  }

  const subject = await prisma.subject.create({ data: parsed.data });

  await logAdminAction(admin, "SUBJECT_CREATED", {
    targetType: "Subject",
    targetId: subject.id,
    metadata: { name: subject.name, level: subject.level },
  });

  return NextResponse.json({ success: true, subject }, { status: 201 });
}
