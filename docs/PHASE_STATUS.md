# Page-by-page status

Legend: ✅ built this phase · 🗂️ folder scaffolded, not implemented · ⏳ planned

## Public
- Home — ✅ placeholder branding page
- Login — ✅ credentials + Google, generic error message
- Register — ✅ level/combination select, password confirm, terms checkbox, optional avatar upload
- Forgot Password — ✅ generic response, dual per-email/per-IP rate limiting
- Verify Code — ✅ 6-digit code, hashed at rest, 10-min expiry, one-time use, 5-attempt lockout
- Reset Password — ✅ requires short-lived signed token from a successful verification, invalidates all existing sessions
- Terms of Use / Privacy Policy / Upload & Copyright Policy — ✅ placeholder legal content (needs real legal review before launch)

## Scholar
- Dashboard — ✅ minimal authenticated landing page with real header/nav
- O Level, A Level — ✅ subject listings (server-rendered, direct Prisma query)
- Subject page — ✅ approved documents for one subject
- Search results — ✅ title search over approved documents
- Document details — ✅ metadata + secure view/download + embedded PDF reader (page nav/zoom/fullscreen) + comments + ratings + report modal + bookmark toggle
- Online reader — ✅ embedded react-pdf viewer for PDFs; other file types show Open/Download only (no in-browser renderer for DOCX/PPTX/XLSX)
- Upload document — ✅ level/subject/type select, copyright confirmation, magic-byte-validated file upload, always lands PENDING
- My uploads — ✅ status list (pending/approved/rejected + rejection reason)
- Premium Documents, Premium activation — ✅ code activation (HMAC-hashed, race-safe redemption), unified premium documents list, WhatsApp fallback pulled from Site Settings (not hardcoded)
- Profile — ✅ name edit + photo change (magic-byte validated, old file cleaned up), read-only email/level/combination/premium status
- Settings — ✅ password change (current-password verification, bcrypt rehash); see note below on JWT sessions
- Notifications — ✅ but derived, not stored: surfaces your own documents' approval/rejection and comments others left on them, computed live from existing tables. No `Notification` model exists, so there's no read/unread state or push delivery — an honest tradeoff rather than a placeholder or a bigger schema change.
- Bookmarks — ✅ toggle on any approved document, list page, backed by the `Bookmark` model (which now has RLS policies — this was a gap from Phase 1 that got fixed alongside this work)
- My ratings — ✅ list of your own ratings with stars
- My comments — ✅ list of your own comments with a delete button (reuses the same endpoint a scholar already had for deleting their own comment)

## Admin
- Admin Login, Admin Phone Verification — ✅ email+password, then a 6-digit SMS code (own hashed-code pipeline, Twilio only delivers the SMS — see `src/lib/sms.ts`), then a signed cookie scoped to that admin's user id, checked on every admin page via `requireVerifiedAdmin()`
- Admin Dashboard — ✅ live counts (pending approvals, scholars, documents, premium users, open reports) linking to each area
- Pending Approvals, All Documents (with status tabs), Document Review — ✅ approve/reject-with-reason/remove-from-view/hard-delete/mark-premium, all audit-logged
- Scholar Management — ✅ search + suspend/unsuspend
- Subject Management, A Level Combination Management — ✅ create/delete (delete blocked with a friendly message if a subject still has documents, since that FK is `ON DELETE RESTRICT`)
- Resource Category Management — ✅ create/delete, but **not wired into the document upload form**, which still uses the fixed `resourceType` enum (Notes/Past Paper/Revision Material/Study Guide/Other) from Phase 1. This table exists per the spec but isn't load-bearing yet — disclosed on the page itself, not hidden.
- Premium Code Creation/Management — ✅ full UI on top of the Phase 5 API (which was retroactively upgraded to require phone-OTP verification, not just the ADMIN role, once that system existed)
- Premium User Management — ✅ list + direct revoke (also revokes the underlying code so the two stay consistent)
- Reports — ✅ list + status change (Open/Reviewed/Dismissed/Actioned)
- Comment Moderation — ✅ recent-comments feed with remove, across all documents. There's no separate "reported comments" queue — the `Report` model is document-scoped only, so this is a direct moderation feed rather than a triage list fed by comment-specific reports.
- WhatsApp Settings — ✅ (a thin page pointing at Site Settings, since a WhatsApp number is just one entry in that same key-value store — no duplicate form)
- Site Settings — ✅ generic key-value editor, WhatsApp number featured at the top
- Audit Logs — ✅ viewer, most recent 200 actions
- **No dedicated "Premium Documents" admin page** — the spec lists this separately, but the existing Documents page's premium-toggle already covers marking/unmarking, so a second page would have been near-duplicate functionality. Noted here rather than silently dropped.

## What actually works right now (Phase 1 through 7)
- `npm install && npx prisma generate` will produce a typed Prisma client from the full schema.
- `npx prisma migrate deploy` (against a real Postgres instance) applies the hand-written initial migration in `prisma/migrations/20260101000000_init/` — no shadow database, no `migrate dev` needed for normal setup.
- `npm run prisma:apply-rls` will lock down every sensitive table with the policies in `prisma/rls.sql`, including the `Bookmark` policies added this phase.
- `npm run prisma:seed` seeds example A Level combinations, O/A Level subjects, resource categories, and a placeholder WhatsApp number in Site Settings.
- Full registration → login → forgot-password → verify-code → reset-password loop is wired end to end against real Postgres tables, with rate limiting, hashed codes.
- Google sign-in is coded and will work as soon as real `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set — see the live-config checklist below.
- Profile photo upload/change is live (magic-byte validated, served only via an authenticated route, old file cleaned up on change).
- Document upload → PENDING → secure file streaming pipeline is fully wired: uploads are validated by magic bytes (not extension), stored on the persistent disk, and only ever served through an authenticated route that checks approval status, ownership, admin role, and live premium status.
- Scholars can browse subjects, search, upload, track upload status, read PDFs in an embedded viewer, comment, rate, report, bookmark, see a real (if derived, not stored) notifications feed, and manage their own profile/password/ratings/comments.
- The full admin panel is live: phone-OTP-gated login, dashboard, document moderation, scholar/subject/combination/resource-category management, premium code and user management, reports, comment moderation, site settings, and an audit log viewer. Every admin route requires both the ADMIN role and a phone-OTP-verified signed cookie — role alone is never sufficient (see the correction below for why this needed a retrofit on two Phase 5 endpoints).
- The official XAS badge (`public/xas-badge.png`, the exact supplied artwork — never regenerated) appears via a single shared `<XasBadge>` component on every scholar and admin page.
- Middleware protects every scholar-facing route group; admin routes are intentionally NOT in the middleware matcher (see the correction below) and are instead gated by `requireVerifiedAdmin()` in each admin page/route directly.

Nothing here is a fake/decorative button — where a page can't be fully built without a bigger schema change (Notifications), that limitation is stated on the page itself and in this document, not hidden behind something that looks finished but does nothing.

## A real architectural correction made this phase
Phase 1 designed Row Level Security policies that assumed every query would run inside a request-scoped Postgres session variable set by `withRlsContext()` — but Phase 2/3's actual route code mostly used the plain `prisma` client directly, without ever setting that context. Under enforced RLS this would have silently **broken** (not exposed — RLS fails closed) core flows: uploading a document, commenting, rating, reporting, and any premium-code operation would have been rejected by policies expecting an identity that was never provided.

While fixing this for Phase 4/5, a second problem surfaced: putting RLS on the `User` table itself doesn't work well with NextAuth's `PrismaAdapter` (which manages `User`/`Account`/`Session` directly and can't participate in our session-variable convention) and breaks any relation-select that joins to `User` (an uploader's name, a comment author's name) regardless of context, since Postgres RLS applies even to joined rows.

**Resolution:** `withRlsContext()` is now actually used everywhere it needs to be (uploads, comments, ratings, reports, premium code create/redeem/revoke, audit log writes), and RLS coverage was scoped down to exactly the tables reached exclusively through our own code — `Document`, `Comment`, `Rating`, `Report`, `PremiumCode`, `AuditLog`, `SiteSetting`, and now `Bookmark`. `User`/`Account`/`Session`/`VerificationToken` rely on application-layer checks instead (which were already correct throughout — every route explicitly checks `getCurrentUser()` and compares ids/roles before acting). Full reasoning is inline in `prisma/rls.sql`.

## Corrections made during Phase 6/7
- **Two Phase 5 endpoints predated the OTP-verification system.** `/api/admin/premium-codes` (create/list) and its `/revoke` route were built before phone-OTP verification existed, and only checked `role === "ADMIN"` — meaning an admin who'd logged in but never completed phone verification could still create or revoke premium codes. Upgraded both to `getVerifiedAdmin()`, consistent with every other admin action. The comment-delete endpoint had the same gap for its admin-delete-any-comment path (its self-delete-own-comment path was always fine, since that never needed elevated admin trust) — fixed the same way.
- **An overclaiming comment in `reset-password.ts`.** It said a `Session` table delete there "invalidates every existing session" — but this app uses NextAuth's JWT session strategy, under which no `Session` table rows are ever created for the credentials/JWT flow, so that delete always affected zero rows. It was dead code implying a security guarantee that wasn't real. Removed it and replaced the comment with an honest explanation rather than leaving a plausible-looking but false claim in the code. The new password-change endpoint (`/api/settings/password`) carries the same honest caveat instead of repeating the original mistake.
- **`Bookmark` had no RLS policies at all** — a genuine gap from Phase 1 that nothing until now actually exercised (the model existed but was unused). Added the same self-or-admin pattern used for `Rating`.
- **Admin auth was moved out of middleware entirely.** An earlier version of `middleware.ts` had a shallow `role !== "ADMIN"` check for `/admin/*`. Real admin authorization needs the phone-OTP-verified signed cookie too, which is verified with Node's `crypto` module — not available in the Edge runtime middleware runs under by default. Rather than maintain two divergent admin checks (a weak one in middleware, a real one in page code), admin routes were removed from the middleware matcher and rely entirely on `requireVerifiedAdmin()`/`getVerifiedAdmin()`.


Once RLS was actually being enforced correctly (see above), a second round
of problems surfaced that had nothing to do with RLS: `npm run build`
could fail in an environment without every optional service configured,
the local dev workflow depended on Prisma commands that don't work
reliably on Termux/Android, and the project folder name didn't match the
user's real local folder. All of these are now fixed:

- **Termux-hostile commands removed from the normal workflow.**
  `prisma migrate dev` needs a temporary shadow database and `prisma
  studio` runs its own local web server — both have caused reliability
  problems on Android. The initial schema now ships as a hand-written
  migration (`prisma/migrations/20260101000000_init/migration.sql`) that
  exactly matches `schema.prisma`, so the normal workflow only ever needs
  `prisma migrate deploy` (which just applies existing SQL — no shadow DB).
  For viewing/editing data without a UI yet, the README now points to
  plain `psql` instead of Studio.
- **`npm run build` no longer depends on optional env vars being set.**
  `PrismaClient` reads `DATABASE_URL` at construction time and throws
  immediately if it's completely unset — and merely *importing* a route
  module (which `next build` does for every route, to collect its
  metadata) was enough to trigger that construction, whether or not the
  route actually runs at build time. `src/server/db.ts` now falls back to
  an inert placeholder URL when `DATABASE_URL` is unset, so the build
  succeeds; any real query still fails normally (and correctly) without a
  real database. Similarly, `src/lib/mailer.ts`'s Resend client is now
  constructed lazily on first actual send, not at module import time.
- **Every database-reading page is now explicitly `dynamic =
  "force-dynamic"`.** These pages were already effectively dynamic (they
  all read the session via cookies, which Next.js detects automatically),
  but making it explicit removes any doubt and guards against a future
  Next.js version changing that inference.
- **Local file storage no longer needs a mounted disk.** `FILE_STORAGE_ROOT`
  now defaults to `./data/uploads` inside the project folder when unset,
  instead of assuming `/data/xas-uploads` exists. Render production sets
  `FILE_STORAGE_ROOT=/data/xas-uploads` explicitly once a Persistent Disk
  is attached; Termux/local dev leaves the variable unset and gets the
  relative-folder default automatically.
- **Project renamed** from `xas-platform` to `xtream` throughout, to match
  the real local folder name.
- **`.env` secret-generation instructions corrected.** A `$(...)` shell
  command substitution doesn't execute inside a `.env` file — it's just
  text. The README now says to run `openssl rand -base64 32` as a real
  terminal command and paste its output into `.env` by hand, and is
  explicit that the generated value should never be sent to Claude,
  ChatGPT, or anyone else.
- **A `.gitignore` was added** — none existed before, which matters now
  that GitHub is the explicit source of truth (`node_modules/`, `.env`,
  `.next/`, and the local `data/` upload folder are all excluded).
- **Prisma version confirmed stable, not changed.** `prisma`/`@prisma/client`
  were already pinned to `5.18.0` — a stable GA release, not an RC or
  prerelease — so no version change was needed here, only a note
  confirming it.
- No dependencies were added or removed in this pass — every fix above was
  a code/configuration change, not a new package.

## Requires live configuration to actually work (cannot be verified in a sandbox)
- **Render PostgreSQL** — a real `DATABASE_URL` to run migrations/seed against.
- **Google OAuth** — a real Google Cloud OAuth client (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`), with the Render URL's `/api/auth/callback/google` added as an authorized redirect URI.
- **Resend** — a real `RESEND_API_KEY` and a verified sending domain/`RESEND_FROM_EMAIL`; without it, reset codes are only logged to the server console (see `src/lib/mailer.ts`), which is fine for local testing but obviously not for real users.
- **Twilio** — a real `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_PHONE_NUMBER` for admin phone OTP delivery; without it, the OTP is only logged to the server console (see `src/lib/sms.ts`), same pattern as Resend. Also: **each admin account needs a `phoneNumber` set** (there's no UI for this yet — set it via `psql`: `UPDATE "User" SET "phoneNumber" = '+1...' WHERE email = '...';`) or `/api/admin/send-otp` will refuse with a clear error.
- **`NEXTAUTH_SECRET`** / **`PREMIUM_CODE_HASH_SECRET`** — must be real random secrets in production, generated with `openssl rand -base64 32` and pasted into `.env`/Render's env var settings directly (session signing, the password-reset bridge token, the admin-verified cookie, and premium code hashing all depend on these).
- **Render Persistent Disk** — `FILE_STORAGE_ROOT` must be set to `/data/xas-uploads` and an actual disk mounted there in Render, or document/avatar uploads will fail/vanish on redeploy. Locally, leave this unset — see above.
- The PDF reader loads its worker script from `unpkg.com` at runtime (`src/components/DocumentReader.tsx`) — this needs outbound internet access from the browser (normal for a deployed site), not from Render itself.
- I still cannot execute `npm install`, `tsc`, `next build`, or `next start` in this sandbox (no network access) — this pass was a thorough manual code review, not an actual compile/run. Please run the three acceptance commands (`npm install`, `npm run build`, `npm start`) yourself and report back the exact output if anything fails, so any remaining issue can be fixed precisely rather than guessed at. Also run `npx next lint --fix` to catch any JSX apostrophe issues before removing the temporary `eslint.ignoreDuringBuilds` override in `next.config.js`.
- **No admin account exists by default** — registration always creates a `SCHOLAR`. Promote one via `psql`: `UPDATE "User" SET role='ADMIN', "phoneNumber"='+1...' WHERE email='...';`, then sign in at `/admin/login`.
- Testing the "approved"/premium scholar experience no longer requires `psql` at all — once you have an admin account, use the real Pending Approvals and Documents pages.
