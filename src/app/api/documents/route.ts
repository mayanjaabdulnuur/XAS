import { NextResponse } from "next/server";
import { prisma, withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const subjectId = searchParams.get("subjectId");
  const q = searchParams.get("q")?.trim();
  const mine = searchParams.get("mine") === "true";

  if (mine) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }
    // Must run under RLS context: this is the one listing that includes
    // PENDING/REJECTED rows, which the Document RLS policy only allows
    // through when app.current_user_id matches the uploader.
    const documents = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
      tx.document.findMany({
        where: { uploaderId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          rejectionNote: true,
          isPremium: true,
          createdAt: true,
          subject: { select: { name: true } },
        },
      })
    );
    return NextResponse.json({ documents });
  }

  const documents = await prisma.document.findMany({
    where: {
      status: "APPROVED",
      level: level === "O_LEVEL" || level === "A_LEVEL" ? level : undefined,
      subjectId: subjectId || undefined,
      title: q ? { contains: q, mode: "insensitive" } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      resourceType: true,
      year: true,
      isPremium: true,
      downloadCount: true,
      viewCount: true,
      createdAt: true,
      subject: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json({ documents });
}
