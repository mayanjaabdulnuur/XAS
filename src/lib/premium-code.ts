import { randomBytes, createHmac } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I, avoids visual ambiguity

function randomSegment(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

/** Generates a code like "XAS-7K2P-9QXZ" — ~40 bits of entropy across the two segments. */
export function generatePremiumCode(): string {
  return `XAS-${randomSegment(4)}-${randomSegment(4)}`;
}

function getSecret(): string {
  const secret = process.env.PREMIUM_CODE_HASH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("PREMIUM_CODE_HASH_SECRET or NEXTAUTH_SECRET must be set to hash premium codes");
  }
  return secret;
}

/**
 * Deterministic HMAC-SHA256 hash, NOT bcrypt. Premium codes are
 * high-entropy random tokens (not user-chosen low-entropy secrets like
 * passwords), so a fast keyed hash is the correct tool here — it enables a
 * direct `findUnique({ where: { codeHash } })` lookup instead of fetching
 * every active code and comparing one-by-one, while still being
 * infeasible to reverse without the server secret.
 */
export function hashPremiumCode(code: string): string {
  return createHmac("sha256", getSecret()).update(code.toUpperCase().trim()).digest("hex");
}

/** e.g. "XAS-7K2P-9QXZ" -> "XAS-****-9QXZ", for admins to recognize a code without re-displaying it in full. */
export function maskPremiumCode(code: string): string {
  const parts = code.split("-");
  if (parts.length !== 3) return "XAS-****-****";
  return `${parts[0]}-****-${parts[2]}`;
}
