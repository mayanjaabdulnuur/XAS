import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

// Local/Termux dev: defaults to a plain relative folder — no mounted disk
// required. Render production: set FILE_STORAGE_ROOT=/data/xas-uploads
// explicitly (that path only exists once a Render Persistent Disk is
// attached and mounted there — see README's Render deployment section).
export const STORAGE_ROOT = process.env.FILE_STORAGE_ROOT || path.join(process.cwd(), "data", "uploads");
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

type SniffResult = { ext: "jpg" | "png" | "webp"; mime: string } | null;

/**
 * Reads the first bytes of the buffer to identify the real file type by
 * magic number — never trust the client-supplied extension or the
 * browser-reported MIME type alone (both are trivially spoofable).
 */
function sniffImageType(buf: Buffer): SniffResult {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

export class FileValidationError extends Error {}

/**
 * Validates and saves a profile photo upload to the persistent disk.
 * Returns the relative path to store on the User record (never store an
 * absolute filesystem path or a client-controlled filename).
 */
export async function saveAvatarUpload(file: File): Promise<string> {
  if (file.size === 0) throw new FileValidationError("Empty file");
  if (file.size > MAX_AVATAR_BYTES) {
    throw new FileValidationError("Image must be smaller than 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageType(buffer);
  if (!sniffed) {
    throw new FileValidationError("File must be a JPG, PNG, or WEBP image");
  }

  const dir = path.join(STORAGE_ROOT, "avatars");
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${sniffed.ext}`;
  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, buffer);

  // Stored as a relative path; the serving route joins it back with
  // STORAGE_ROOT so the DB never contains an absolute host filesystem path.
  return path.join("avatars", filename);
}

export function resolveStoredPath(relativePath: string): string {
  // Defends against path traversal in a stored value (defense-in-depth;
  // paths we write ourselves are always safe UUIDs, but this guards
  // against any future code path that might pass through unsanitized input).
  const resolved = path.join(STORAGE_ROOT, relativePath);
  if (!resolved.startsWith(path.resolve(STORAGE_ROOT))) {
    throw new FileValidationError("Invalid file path");
  }
  return resolved;
}

export function mimeForExt(ext: string): string {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
