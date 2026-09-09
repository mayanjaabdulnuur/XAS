import { NextResponse } from "next/server";
import { prisma, withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { commentSchema } from "@/lib/validation";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Listing non-removed comments has no identity-dependent branch in the
  // RLS policy, so the plain client is fine here — no PENDING-style gap.
  const comments = await prisma.comment.findMany({
    where: { documentId: params.id, isRemoved: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to comment" }, { status: 401 });
  }

  const rl = await consumeRateLimit(`comment:${user.id}`, 20, 60 * 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "You're commenting too fast. Please slow down." }, { status: 429 });
  }

  const document = await prisma.document.findUnique({ where: { id: params.id } });
  if (!document || document.status !== "APPROVED") {
    return NextResponse.json({ error: "You can only comment on approved documents" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  const comment = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.comment.create({
      data: { documentId: params.id, userId: user.id, body: parsed.data.body },
      select: {
        id: true,
        body: true,
        createdAt: true,
        userId: true,
        user: { select: { firstName: true, lastName: true } },
      },
    })
  );

  return NextResponse.json({ comment }, { status: 201 });
}
