import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import { verifyAdminVerifiedToken, ADMIN_VERIFIED_COOKIE } from "./admin-verification";

/**
 * Use at the top of every protected admin page/route. Requires BOTH an
 * ADMIN-role session AND a still-valid phone-OTP-verification cookie
 * scoped to that exact user id — a stolen/guessed session JWT alone is
 * not enough to reach the admin panel, matching the spec's "email +
 * password -> phone OTP -> Admin Panel" flow.
 *
 * Not implemented as Next.js middleware: our OTP verification token is
 * signed with Node's `crypto` module (HMAC), which isn't available in the
 * Edge runtime middleware normally runs under — so this check lives in
 * page/route code instead, which always runs on the Node runtime.
 */
export async function requireVerifiedAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_VERIFIED_COOKIE)?.value;
  if (!verifyAdminVerifiedToken(token, user.id)) {
    redirect("/admin/verify-phone");
  }

  return user;
}

/** Same checks, but returns null instead of redirecting — for use inside API route handlers. */
export async function getVerifiedAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;

  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_VERIFIED_COOKIE)?.value;
  if (!verifyAdminVerifiedToken(token, user.id)) return null;

  return user;
}
