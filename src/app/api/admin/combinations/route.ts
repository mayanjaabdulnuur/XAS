import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { combinationUpsertSchema } from "@/lib/validation";

export async function GET() {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const combinations = await prisma.aLevelCombination.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ combinations });
}

export async function POST(req: Request) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = combinationUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fix the highlighted fields" }, { status: 400 });
  }

  const existing = await prisma.aLevelCombination.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return NextResponse.json({ error: "A combination with that code already exists" }, { status: 409 });
  }

  const combination = await prisma.aLevelCombination.create({ data: parsed.data });
  return NextResponse.json({ success: true, combination }, { status: 201 });
}
