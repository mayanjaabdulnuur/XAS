import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  await prisma.resourceCategory.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
