import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { resolveStoredPath, mimeForExt } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  // Profile photos aren't highly sensitive, but we still require a logged-in
  // session (never serve any uploaded file from a fully public path) —
  // consistent with "never trust an object-storage bucket to be the only
  // access control" from the technical plan.
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { avatarPath: true },
  });

  if (!user?.avatarPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const fullPath = resolveStoredPath(user.avatarPath);
    const buffer = await readFile(fullPath);
    const ext = path.extname(fullPath).slice(1);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeForExt(ext),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
