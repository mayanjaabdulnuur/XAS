import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_SECONDS = 10 * 60; // must be used within 10 minutes of verification

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET must be set to sign password-reset tokens");
  }
  return secret;
}

/** Issues a short-lived token binding a verified email to a reset action. */
export function signResetToken(email: string): string {
  const expires = Date.now() + TOKEN_TTL_SECONDS * 1000;
  const payload = `${email}.${expires}`;
  const signature = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

/** Returns the verified email, or null if the token is invalid/expired/tampered. */
export function verifyResetToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [email, expiresStr, signature] = decoded.split(".");
    if (!email || !expiresStr || !signature) return null;

    const expectedSignature = createHmac("sha256", getSecret())
      .update(`${email}.${expiresStr}`)
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    if (Date.now() > Number(expiresStr)) return null;

    return email;
  } catch {
    return null;
  }
}
