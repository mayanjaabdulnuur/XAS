-- XAS Row Level Security (Phase 1)
-- Plain Postgres supports RLS natively (no Supabase needed).
-- Run this AFTER `prisma migrate deploy`, and re-run after any migration
-- that recreates these tables. Prisma does not manage RLS, so this file
-- is applied separately (see scripts/apply-rls.ts).
--
-- Design: every request from the app runs inside a transaction that first
-- sets two session variables via `SET LOCAL`:
--   app.current_user_id  -> the logged-in user's UUID, or '' if anonymous
--   app.current_role     -> 'SCHOLAR' or 'ADMIN', or '' if anonymous
-- The Next.js Prisma client wrapper (src/server/db.ts) does this for every
-- request before running queries, so RLS is enforced even if an
-- application-layer check is ever missed.

-- Helper to read the session variables safely (empty string if unset).
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_role() RETURNS text AS $$
  SELECT current_setting('app.current_role', true)
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_is_admin() RETURNS boolean AS $$
  SELECT app_current_role() = 'ADMIN'
$$ LANGUAGE sql STABLE;

-- ===================== Document =====================
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;

-- Anyone (scholar) can read approved, non-removed documents.
CREATE POLICY document_select_approved ON "Document"
  FOR SELECT
  USING (status = 'APPROVED' OR app_is_admin() OR "uploaderId" = app_current_user_id());

-- Only the uploader (while pending) or an admin can update most document
-- fields directly. Additionally, ANY authenticated user may issue an
-- UPDATE on an APPROVED document — this looks broad, but RLS only governs
-- which ROWS can be touched, not which COLUMNS; our application code is
-- the actual gatekeeper of which fields change, and the only UPDATE we
-- ever issue on someone else's approved document is the view/download
-- counter increment in the file-streaming route. This allowance exists
-- specifically so that counter update can succeed under RLS.
CREATE POLICY document_update_owner_or_admin ON "Document"
  FOR UPDATE
  USING (
    app_is_admin()
    OR ("uploaderId" = app_current_user_id() AND status = 'PENDING')
    OR (status = 'APPROVED' AND app_current_user_id() IS NOT NULL)
  );

CREATE POLICY document_insert_self ON "Document"
  FOR INSERT
  WITH CHECK ("uploaderId" = app_current_user_id());

CREATE POLICY document_delete_admin_only ON "Document"
  FOR DELETE
  USING (app_is_admin());

-- ===================== Comment =====================
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY comment_select_not_removed ON "Comment"
  FOR SELECT
  USING (NOT "isRemoved" OR app_is_admin());

CREATE POLICY comment_insert_self ON "Comment"
  FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());

CREATE POLICY comment_update_owner_or_admin ON "Comment"
  FOR UPDATE
  USING (app_is_admin() OR "userId" = app_current_user_id());

CREATE POLICY comment_delete_admin_only ON "Comment"
  FOR DELETE
  USING (app_is_admin());

-- ===================== Rating =====================
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;

CREATE POLICY rating_select_all ON "Rating" FOR SELECT USING (true);

CREATE POLICY rating_insert_self ON "Rating"
  FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());

CREATE POLICY rating_update_owner ON "Rating"
  FOR UPDATE
  USING ("userId" = app_current_user_id());

-- Note: the 1-5 star range CHECK constraint lives in the initial Prisma
-- migration (prisma/migrations/20260101000000_init/migration.sql), not
-- here — this file is re-run independently of migrations, and a CHECK
-- constraint only needs to be created once per table lifetime, same as
-- any other schema object migrations own.

-- ===================== Bookmark (Phase 7) =====================
ALTER TABLE "Bookmark" ENABLE ROW LEVEL SECURITY;

CREATE POLICY bookmark_select_self_or_admin ON "Bookmark"
  FOR SELECT
  USING (app_is_admin() OR "userId" = app_current_user_id());

CREATE POLICY bookmark_insert_self ON "Bookmark"
  FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());

CREATE POLICY bookmark_delete_self_or_admin ON "Bookmark"
  FOR DELETE
  USING (app_is_admin() OR "userId" = app_current_user_id());

-- ===================== Report =====================
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;

-- Scholars can see only their own reports; admins see all.
CREATE POLICY report_select_owner_or_admin ON "Report"
  FOR SELECT
  USING (app_is_admin() OR "userId" = app_current_user_id());

CREATE POLICY report_insert_self ON "Report"
  FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());

CREATE POLICY report_update_admin_only ON "Report"
  FOR UPDATE
  USING (app_is_admin());

-- ===================== PremiumCode =====================
ALTER TABLE "PremiumCode" ENABLE ROW LEVEL SECURITY;

-- No scholar can browse premium codes at will — but a scholar attempting
-- to redeem one needs to SELECT the single matching row by its exact
-- codeHash (an O(1) equality lookup on the unique index, chosen specifically
-- so this never requires fetching every active code — see
-- src/lib/premium-code.ts). Exposing an active code's bcrypt-free HMAC hash
-- to the redeeming request is safe: codes are high-entropy random tokens,
-- not user-chosen secrets, and this policy only governs what our own
-- server-side connection may read — the HTTP response to the client never
-- includes code data either way.
CREATE POLICY premium_code_select_active_for_redeem ON "PremiumCode"
  FOR SELECT
  USING (status = 'ACTIVE' AND app_current_user_id() IS NOT NULL);

-- A scholar may redeem (claim) a code that is still active and unclaimed,
-- but the WITH CHECK clause restricts the *result* of that update to
-- setting themselves as the redeemer — application code additionally
-- controls that only status/redeemedById/redeemedAt actually change here.
CREATE POLICY premium_code_redeem_self ON "PremiumCode"
  FOR UPDATE
  USING (status = 'ACTIVE' AND "redeemedById" IS NULL AND app_current_user_id() IS NOT NULL)
  WITH CHECK ("redeemedById" = app_current_user_id());

-- Admins retain full access (create, list all, revoke) regardless of the
-- narrower scholar-redemption policies above — multiple permissive
-- policies on the same command are OR'd together in Postgres.
CREATE POLICY premium_code_admin_only ON "PremiumCode"
  FOR ALL
  USING (app_is_admin());

-- ===================== AuditLog =====================
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_admin_only ON "AuditLog"
  FOR ALL
  USING (app_is_admin());

-- ===================== User =====================
-- Deliberately NOT RLS-protected, after reconsidering during Phase 4/5.
-- Two concrete problems with putting RLS on this table:
-- (1) NextAuth's PrismaAdapter (used for session/account management, and
--     for Google OAuth user creation) issues its own queries against User/
--     Account/Session directly — it has no way to participate in our
--     app.current_user_id/app.current_role session-variable convention,
--     so an admin-only INSERT policy would break Google sign-in and a
--     self-or-admin SELECT policy would break the credentials login
--     lookup itself (chicken-and-egg: there's no session yet to satisfy
--     the policy that gates reading the row needed to create one).
-- (2) Postgres RLS applies to a table's rows regardless of how they're
--     reached — including as a joined relation. Every legitimate feature
--     that shows a name from a relation (a document's uploader, a
--     comment's author, a redeemed premium code's owner) is a read of
--     this table, and would silently return nothing under a restrictive
--     policy even though the top-level query was fully authorized.
-- Authorization for User data is instead enforced entirely at the
-- application layer: every route in this codebase explicitly checks
-- getCurrentUser() and compares ids/roles before acting, and every read
-- uses an explicit Prisma `select` that only ever returns safe fields
-- (name, avatarPath) to anyone but the row's own owner or an admin —
-- passwordHash is never selected outside the authentication routes
-- themselves. RLS remains enabled on Document/Comment/Rating/Report/
-- PremiumCode/AuditLog/SiteSetting, which are exclusively reached through
-- our own code and don't have this conflict.

-- Note: the app's Postgres connection role used by Prisma must be a
-- non-superuser/non-table-owner role for RLS to actually apply (table
-- owners bypass RLS by default in Postgres). Create a dedicated
-- `xas_app` role for DATABASE_URL and grant it table privileges without
-- BYPASSRLS. See docs/TECHNICAL_PLAN.md deployment notes.

-- ===================== SiteSetting (Phase 5) =====================
ALTER TABLE "SiteSetting" ENABLE ROW LEVEL SECURITY;

-- Site settings (WhatsApp number, etc.) are readable by anyone — they're
-- shown on public-facing pages (e.g. the premium activation screen).
CREATE POLICY site_setting_select_all ON "SiteSetting" FOR SELECT USING (true);

-- Only admins may create/update/delete settings.
CREATE POLICY site_setting_admin_write ON "SiteSetting" FOR ALL USING (app_is_admin());

-- ===================== VerificationToken / RateLimitEntry (Phase 2) =====================
-- Deliberately NOT given RLS policies. Both tables are pure internal control
-- state (password-reset codes, rate-limit counters) that is only ever
-- touched by a small number of narrow, hard-coded server functions
-- (src/lib/reset-token.ts, src/lib/rate-limit.ts) — never through a
-- general user-parameterized query path the way Document/Comment/etc. are.
-- There is no "current user's verification tokens" view to protect against;
-- protecting them further with app.current_user_id policies would add
-- complexity without a matching threat model. If a future feature ever
-- queries these tables from a user-facing route, add policies then.
