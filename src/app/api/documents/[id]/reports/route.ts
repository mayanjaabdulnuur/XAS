import { NextResponse } from "next/server";
import { prisma, withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { reportSchema } from "@/lib/validation";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to report a document" }, { status: 401 });
  }

  const rl = await consumeRateLimit(`report:${user.id}`, 10, 60 * 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many reports submitted recently." }, { status: 429 });
  }

  const document = await prisma.document.findUnique({ where: { id: params.id } });
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Select a valid reason" }, { status: 400 });
  }

  await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.report.create({
      data: {
        documentId: params.id,
        userId: user.id,
        reason: parsed.data.reason,
        details: parsed.data.details || null,
      },
    })
  );

  return NextResponse.json({ success: true });
}
