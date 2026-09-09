import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";

export async function GET() {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const reports = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.report.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        document: { select: { id: true, title: true, status: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    })
  );

  return NextResponse.json({ reports });
}
