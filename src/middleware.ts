import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Deliberately does NOT cover /admin/*. Full admin authorization (ADMIN
// role AND a verified phone-OTP cookie, scoped to the exact user id) is
// enforced in src/lib/admin-guard.ts instead, which every admin page/route
// calls directly. That check is signed with Node's `crypto` module, which
// isn't available in the Edge runtime middleware runs under by default —
// so rather than have two divergent, partially-overlapping admin checks
// (a shallow role-only one here, plus the real one in page code), admin
// auth lives entirely in admin-guard.ts. This middleware only ever gates
// the scholar-facing routes, where a plain "is there a session" check is
// both sufficient and Edge-compatible.
export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Public routes never reach this middleware (see matcher below).
        // Everything matched here requires at least a logged-in user.
        return !!token;
      },
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/upload/:path*",
    "/my-uploads/:path*",
    "/premium/:path*",
    "/bookmarks/:path*",
    "/o-level/:path*",
    "/a-level/:path*",
    "/subject/:path*",
    "/document/:path*",
    "/search/:path*",
    "/notifications/:path*",
    "/my-ratings/:path*",
    "/my-comments/:path*",
  ],
};
