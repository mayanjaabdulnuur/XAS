import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");

  const subjects = await prisma.subject.findMany({
    where: level === "O_LEVEL" || level === "A_LEVEL" ? { level } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, level: true, slug: true },
  });

  return NextResponse.json({ subjects });
}
