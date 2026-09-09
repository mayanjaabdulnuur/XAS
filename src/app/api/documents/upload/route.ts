import { NextResponse } from "next/server";
import { prisma, withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { documentUploadSchema } from "@/lib/validation";
import { saveDocumentUpload } from "@/lib/document-storage";
import { FileValidationError } from "@/lib/storage";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to upload a document" }, { status: 401 });
  }

  // Modest per-user rate limit — this is about abuse prevention, not
  // normal usage; a genuine scholar won't hit this uploading real work.
  const rl = await consumeRateLimit(`document-upload:${user.id}`, 20, 60 * 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many uploads recently. Please try again later." },
      { status: 429 }
    );
  }

  const formData = await req.formData();

  const raw = {
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    level: formData.get("level")?.toString() ?? "",
    subjectId: formData.get("subjectId")?.toString() ?? "",
    resourceType: formData.get("resourceType")?.toString() ?? "",
    year: formData.get("year")?.toString() || undefined,
    copyrightConfirmed: formData.get("copyrightConfirmed")?.toString() === "true",
  };

  const parsed = documentUploadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
  if (!subject || subject.level !== data.level) {
    return NextResponse.json({ error: "Select a valid subject for the chosen level" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Attach a file to upload" }, { status: 400 });
  }

  let saved;
  try {
    saved = await saveDocumentUpload(file);
  } catch (err) {
    if (err instanceof FileValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const document = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.document.create({
      data: {
        title: data.title,
        description: data.description || null,
        level: data.level,
        subjectId: data.subjectId,
        resourceType: data.resourceType,
        year: data.year ?? null,
        uploaderId: user.id,
        filePath: saved.relativePath,
        originalFilename: file.name,
        mimeType: saved.mimeType,
        fileSizeBytes: saved.sizeBytes,
        copyrightConfirmed: true,
        status: "PENDING",
      },
      select: { id: true, status: true },
    })
  );

  return NextResponse.json({ success: true, document }, { status: 201 });
}
