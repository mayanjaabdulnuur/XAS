import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";

export async function GET() {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { premiumStatus: true },
    orderBy: { premiumExpires: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      premiumExpires: true,
    },
  });

  return NextResponse.json({ users });
}
