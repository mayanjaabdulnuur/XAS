import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { resourceCategoryUpsertSchema } from "@/lib/validation";

export async function GET() {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const categories = await prisma.resourceCategory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = resourceCategoryUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fix the highlighted fields" }, { status: 400 });
  }

  const existing = await prisma.resourceCategory.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
  }

  const category = await prisma.resourceCategory.create({ data: parsed.data });
  return NextResponse.json({ success: true, category }, { status: 201 });
}
