import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { reportStatusUpdateSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = reportStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const report = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.report.update({ where: { id: params.id }, data: { status: parsed.data.status } })
  );

  return NextResponse.json({ success: true, report });
}
