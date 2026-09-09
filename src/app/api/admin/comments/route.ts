import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";

export async function GET() {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const comments = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.comment.findMany({
      where: { isRemoved: false },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        document: { select: { id: true, title: true } },
      },
    })
  );

  return NextResponse.json({ comments });
}
