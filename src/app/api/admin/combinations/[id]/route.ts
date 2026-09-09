import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { combinationUpsertSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = combinationUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fix the highlighted fields" }, { status: 400 });
  }

  const combination = await prisma.aLevelCombination.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json({ success: true, combination });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  // User.combinationId is ON DELETE SET NULL, so this is always safe —
  // affected scholars just lose their combination reference.
  await prisma.aLevelCombination.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
