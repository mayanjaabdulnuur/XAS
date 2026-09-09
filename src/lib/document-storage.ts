import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { FileValidationError, STORAGE_ROOT } from "./storage";

const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

type Sniffed = { ext: string; mime: string } | null;

const OOXML_MARKERS: Record<string, { ext: string; mime: string }> = {
  "word/": { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  "ppt/": { ext: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  "xl/": { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
};

/**
 * Identifies the real file type from magic bytes / internal structure —
 * never trusts the client-supplied extension or MIME type alone (both are
 * trivially spoofable, e.g. renaming a .exe to .pdf).
 */
function sniffDocumentType(buf: Buffer): Sniffed {
  // PDF
  if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") {
    return { ext: "pdf", mime: "application/pdf" };
  }

  // JPEG
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }

  // PNG
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { ext: "png", mime: "image/png" };
  }

  // WEBP
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }

  // DOCX/PPTX/XLSX are all ZIP containers (PK\x03\x04). Confirm which
  // Office format by looking for its characteristic internal folder name
  // rather than trusting the extension — a renamed .zip would fail this.
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) {
    // Search a generous leading window — OOXML zips list their content
    // types and first parts near the start of the archive.
    const window = buf.subarray(0, Math.min(buf.length, 4096)).toString("latin1");
    for (const [marker, info] of Object.entries(OOXML_MARKERS)) {
      if (window.includes(marker)) return info;
    }
    // Fall back to scanning the whole buffer if not found in the window
    // (some producers order entries differently).
    const full = buf.toString("latin1");
    for (const [marker, info] of Object.entries(OOXML_MARKERS)) {
      if (full.includes(marker)) return info;
    }
    return null; // it's a zip, but not one of our supported Office formats
  }

  return null;
}

const IMAGE_EXTS = new Set(["jpg", "png", "webp"]);

export async function saveDocumentUpload(file: File): Promise<{
  relativePath: string;
  mimeType: string;
  ext: string;
  sizeBytes: number;
}> {
  if (file.size === 0) throw new FileValidationError("Empty file");

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffDocumentType(buffer);
  if (!sniffed) {
    throw new FileValidationError(
      "Unsupported or unrecognized file type. Allowed: PDF, DOCX, PPTX, XLSX, JPG, PNG, WEBP."
    );
  }

  const maxBytes = IMAGE_EXTS.has(sniffed.ext) ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size > maxBytes) {
    throw new FileValidationError(
      `File is too large (max ${Math.round(maxBytes / (1024 * 1024))}MB for this type)`
    );
  }

  const dir = path.join(STORAGE_ROOT, "documents");
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${sniffed.ext}`;
  await writeFile(path.join(dir, filename), buffer);

  return {
    relativePath: path.join("documents", filename),
    mimeType: sniffed.mime,
    ext: sniffed.ext,
    sizeBytes: file.size,
  };
}
