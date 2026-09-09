import { createHmac, timingSafeEqual } from "crypto";

const TTL_SECONDS = 12 * 60 * 60; // admin must re-verify via OTP every 12 hours

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET must be set to sign admin verification tokens");
  }
  return secret;
}

/** Issued after a successful phone OTP check; scoped to one specific admin user id. */
export function signAdminVerifiedToken(userId: string): string {
  const expires = Date.now() + TTL_SECONDS * 1000;
  const payload = `${userId}.${expires}`;
  const signature = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

/** Returns true only if the token is validly signed, unexpired, AND matches this exact user id. */
export function verifyAdminVerifiedToken(token: string | undefined, userId: string): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [tokenUserId, expiresStr, signature] = decoded.split(".");
    if (!tokenUserId || !expiresStr || !signature) return false;
    if (tokenUserId !== userId) return false;

    const expectedSignature = createHmac("sha256", getSecret())
      .update(`${tokenUserId}.${expiresStr}`)
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return false;
    }

    return Date.now() <= Number(expiresStr);
  } catch {
    return false;
  }
}

export const ADMIN_VERIFIED_COOKIE = "xas_admin_verified";
