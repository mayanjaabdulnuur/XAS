import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const scholars = await prisma.user.findMany({
    where: {
      role: "SCHOLAR",
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      level: true,
      isSuspended: true,
      premiumStatus: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ scholars });
}
