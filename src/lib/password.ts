import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Generates a cryptographically random 6-digit numeric code (000000-999999). */
export function generateNumericCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Codes are hashed before storage, same principle as passwords/premium codes. */
export async function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, SALT_ROUNDS);
}

export async function verifyCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
