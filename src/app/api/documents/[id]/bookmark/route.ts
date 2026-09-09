import { NextResponse } from "next/server";
import { withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in" }, { status: 401 });

  const existing = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.bookmark.findUnique({
      where: { documentId_userId: { documentId: params.id, userId: user.id } },
    })
  );

  if (existing) {
    await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
      tx.bookmark.delete({ where: { id: existing.id } })
    );
    return NextResponse.json({ bookmarked: false });
  }

  await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.bookmark.create({ data: { documentId: params.id, userId: user.id } })
  );
  return NextResponse.json({ bookmarked: true });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ bookmarked: false });

  const existing = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.bookmark.findUnique({
      where: { documentId_userId: { documentId: params.id, userId: user.id } },
    })
  );

  return NextResponse.json({ bookmarked: !!existing });
}
