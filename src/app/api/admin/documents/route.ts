import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const validStatus = ["PENDING", "APPROVED", "REJECTED", "REMOVED"].includes(status ?? "")
    ? (status as "PENDING" | "APPROVED" | "REJECTED" | "REMOVED")
    : undefined;

  const documents = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.document.findMany({
      where: validStatus ? { status: validStatus } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        subject: { select: { name: true, level: true } },
        uploader: { select: { firstName: true, lastName: true, email: true } },
      },
    })
  );

  return NextResponse.json({ documents });
}
