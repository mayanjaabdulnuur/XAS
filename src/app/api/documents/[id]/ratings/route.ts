import { NextResponse } from "next/server";
import { prisma, withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { ratingSchema } from "@/lib/validation";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();

  const agg = await prisma.rating.aggregate({
    where: { documentId: params.id },
    _avg: { stars: true },
    _count: true,
  });

  let myRating: number | null = null;
  if (user) {
    const mine = await prisma.rating.findUnique({
      where: { documentId_userId: { documentId: params.id, userId: user.id } },
      select: { stars: true },
    });
    myRating = mine?.stars ?? null;
  }

  return NextResponse.json({
    average: agg._avg.stars ?? 0,
    count: agg._count,
    myRating,
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to rate" }, { status: 401 });
  }

  // The unique(documentId, userId) constraint already prevents unlimited
  // ratings from one account; this rate limit is just about update spam.
  const rl = await consumeRateLimit(`rating:${user.id}`, 30, 60 * 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many rating changes. Please slow down." }, { status: 429 });
  }

  const document = await prisma.document.findUnique({ where: { id: params.id } });
  if (!document || document.status !== "APPROVED") {
    return NextResponse.json({ error: "You can only rate approved documents" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.rating.upsert({
      where: { documentId_userId: { documentId: params.id, userId: user.id } },
      update: { stars: parsed.data.stars },
      create: { documentId: params.id, userId: user.id, stars: parsed.data.stars },
    })
  );

  return NextResponse.json({ success: true });
}
