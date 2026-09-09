import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { profileUpdateSchema } from "@/lib/validation";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fix the highlighted fields" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName },
  });

  return NextResponse.json({ success: true });
}
