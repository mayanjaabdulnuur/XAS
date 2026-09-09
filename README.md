# Xtream Advanced Scholars (XAS)

See `docs/TECHNICAL_PLAN.md` for architecture rationale and `docs/PHASE_STATUS.md`
for exactly what is and isn't built yet.

**Foundation model:** Termux is a development environment, GitHub is the
source of truth, and Render (with Render PostgreSQL + a Render Persistent
Disk) is production. Local Termux development uses a real local Postgres
instance too — never SQLite or another engine — so behavior matches
production as closely as possible.

## What's in this delivery
- Full Prisma schema (`prisma/schema.prisma`) covering users, subjects,
  documents, comments, ratings, reports, premium codes, audit logs, site
  settings, A-Level combinations.
- A hand-written initial migration (`prisma/migrations/20260101000000_init/`)
  so the normal workflow only ever needs `prisma migrate deploy` — see
  "Why no `migrate dev` or `studio` in the normal workflow" below.
- Native Postgres RLS policies (`prisma/rls.sql`) + a script to apply them.
- NextAuth wired for email/password (bcrypt) and Google sign-in.
- Route-level middleware protecting scholar and admin areas.
- Tailwind theme tokens matching the XAS navy/gold brand, using the real
  supplied badge (`public/xas-badge.png`).
- Document upload/approval pipeline, comments, ratings, reports, an
  embedded PDF reader, and a premium-code system (API-only — no admin UI
  yet, that's Phase 6).

## Termux setup (local development)

```bash
pkg update -y
pkg install nodejs-lts postgresql unzip -y

cd ~/xtream

# Start Postgres (run initdb once, the very first time only)
initdb $PREFIX/var/lib/postgresql   # first time only
pg_ctl -D $PREFIX/var/lib/postgresql start
createdb xtream                     # first time only

cp .env.example .env
nano .env
```

In `.env`, set at minimum:
```
DATABASE_URL="postgresql://localhost:5432/xtream"
NEXTAUTH_URL="http://localhost:3000"
```

For `NEXTAUTH_SECRET` and `PREMIUM_CODE_HASH_SECRET`, generate each value
with a real command — **do not** put a `$(...)` command substitution
directly inside `.env`, since `.env` files are just plain text and are
never executed as shell script:

```bash
openssl rand -base64 32
```

Run that, copy the line it prints, and paste it as the value in `.env`
(once for `NEXTAUTH_SECRET`, again for `PREMIUM_CODE_HASH_SECRET`). Do not
send that generated value to Claude, ChatGPT, or anyone else — it's a
secret key for your own deployment.

Leave `FILE_STORAGE_ROOT` commented out/unset locally — it defaults
automatically to `./data/uploads` inside the project folder, so Termux
never needs a mounted disk. Leave `GOOGLE_CLIENT_ID`/`RESEND_API_KEY`/etc.
blank too if you don't have them yet; the app degrades gracefully (Google
sign-in button just won't work yet, reset codes log to the console instead
of emailing — see `docs/PHASE_STATUS.md`).

Then:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:apply-rls
npm run prisma:seed
npm run build
npm start
```

Open `http://localhost:3000`.

For day-to-day development after that first setup, `npm run dev` gives you
hot reload; use `npm run build && npm start` when you specifically want to
test the production build path (which is what Render actually runs).

## Why no `migrate dev` or `studio` in the normal workflow

`npx prisma migrate dev` creates a temporary **shadow database** to diff
your schema against, and `npx prisma studio` runs a local web server with
its own port/browser-launch behavior — both have been unreliable on
Android/Termux (shadow DB creation can hit permission/shared-memory issues,
and Studio's server + browser handoff doesn't always behave the same as on
a normal OS).

Neither is needed for the normal workflow:
- **Migrations:** `prisma migrate deploy` (used above and by Render) just
  applies the SQL files already sitting in `prisma/migrations/` — it never
  creates a shadow database. The initial schema is already hand-written
  for you in this repo. If you ever change `prisma/schema.prisma` and need
  a *new* migration, the reliable way to generate one is to run
  `npx prisma migrate dev --name your_change_name` once on a machine where
  that works cleanly — a regular Linux/Mac/Windows dev machine, GitHub
  Codespaces, or a Render shell — then commit the generated migration
  folder. Termux and Render both then just run `migrate deploy` against it
  like normal. This isn't a workaround; it's the same "author once, deploy
  everywhere" model Prisma recommends for team workflows generally.
- **Viewing/editing data:** use `psql` (installed alongside `postgresql` in
  Termux) directly instead of Studio:
  ```bash
  psql xtream
  ```
  Useful one-liners for testing without an admin panel yet (Phase 6):
  ```sql
  -- Promote a user to admin
  UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';

  -- Approve a test document
  UPDATE "Document" SET status = 'APPROVED' WHERE id = 'paste-id-here';

  -- Mark a document premium
  UPDATE "Document" SET "isPremium" = true WHERE id = 'paste-id-here';
  ```
  Type `\q` to exit `psql`. If you'd still like to try Prisma Studio at
  some point, `npx prisma studio` may well work fine on your specific
  device — it's just not something the normal workflow depends on.

## Deploying to Render

1. **Render PostgreSQL** — create a managed Postgres instance. Copy its
   connection string into `DATABASE_URL`.
2. Create a dedicated low-privilege Postgres role for the app
   (`CREATE ROLE xas_app LOGIN PASSWORD '...' NOSUPERUSER NOBYPASSRLS;`,
   then `GRANT` table privileges to it) and point `DATABASE_URL` at that
   role, not the Postgres admin user — table owners bypass RLS by default.
3. **Render Web Service** — connect this repo.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
4. **Render Persistent Disk** — attach a disk, mount it at `/data`, and set
   the `FILE_STORAGE_ROOT` environment variable to `/data/xas-uploads`
   explicitly (this is the one place that path should be set — Termux
   should never set it, so it keeps using its local `./data/uploads`
   default).
5. Set every variable from `.env.example` in the Render dashboard —
   `NEXTAUTH_SECRET` and `PREMIUM_CODE_HASH_SECRET` should be **different**
   random values from whatever you generated for local Termux testing.
6. After first deploy, run `npx prisma migrate deploy` then
   `npm run prisma:apply-rls` (and optionally `npm run prisma:seed`)
   against the production database — via a Render Shell, or a Render "Job".
7. Custom domain and SEO indexing are intentionally left off (`robots`
   metadata blocks indexing) — flip that and add the domain in Render
   whenever you're ready; nothing else needs to change for that.

## Phase history
- **Phase 1–3:** project scaffold, Prisma schema, RLS design, scholar
  auth (registration/login/forgot-password), official XAS badge
  integration, O/A Level subject browsing, document upload + secure
  streaming.
- **Phase 4–5:** embedded PDF reader, comments, ratings, reports, and the
  premium-code system (admin API + scholar activation).
- **Foundation hardening (between Phase 5 and 6):** moved the project to
  the `xtream` folder name, replaced the shadow-DB-dependent migration
  workflow with a hand-written migration + `migrate deploy`, made local
  file storage default to `./data/uploads` with no disk required, made
  Resend/Prisma initialization lazy so a missing optional env var can
  never break `npm run build`, added explicit `dynamic = "force-dynamic"`
  to every page that reads the database, and fixed a real RLS gap where
  Phase 1's policies assumed session context that Phase 2–3's code never
  actually set.
- **Phase 6–7 (this delivery):** the full admin panel — phone-OTP-gated
  login, dashboard, document moderation, scholar/subject/combination/
  resource-category management, premium code and user management UI,
  reports, comment moderation, site settings, audit log viewer — plus
  Phase 7's scholar-side polish: profile editing with photo change,
  password change, a real (derived, not stored) notifications feed,
  bookmarks, and my-ratings/my-comments pages. While building this, two
  Phase 5 admin endpoints and one Phase 4 endpoint were retroactively
  upgraded to require the new phone-OTP verification rather than just the
  ADMIN role, a `Bookmark` RLS gap from Phase 1 was closed, and an
  overclaiming comment about session invalidation in `reset-password.ts`
  was corrected rather than left in place. Full details in
  `docs/PHASE_STATUS.md`.

## Next phase
Nothing further is currently planned — all pages from the original spec
are implemented, with two disclosed, deliberate scope decisions: Resource
Categories exist as an admin-manageable list but aren't yet wired into the
document upload form (which still uses the fixed resource-type enum), and
there's no separate "Premium Documents" admin page since the existing
Documents page's premium-toggle already covers that need. See
`docs/PHASE_STATUS.md` for the complete list of what's built, what's
disclosed-incomplete, and what needs live configuration to actually work.
