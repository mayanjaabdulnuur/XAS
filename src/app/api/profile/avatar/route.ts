import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { saveAvatarUpload, FileValidationError, resolveStoredPath } from "@/lib/storage";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 });
  }

  let relativePath: string;
  try {
    relativePath = await saveAvatarUpload(file);
  } catch (err) {
    if (err instanceof FileValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const previous = await prisma.user.findUnique({ where: { id: user.id }, select: { avatarPath: true } });

  await prisma.user.update({ where: { id: user.id }, data: { avatarPath: relativePath } });

  if (previous?.avatarPath) {
    try {
      await unlink(resolveStoredPath(previous.avatarPath));
    } catch {
      // ignore — old file may already be gone
    }
  }

  return NextResponse.json({ success: true, avatarPath: relativePath });
}
