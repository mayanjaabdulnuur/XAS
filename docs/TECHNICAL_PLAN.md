# XAS — Xtream Advanced Scholars — Technical Plan

## Stack (Render-only, no BaaS)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router, TypeScript) | SSR + API routes in one deployable, Render Web Service friendly |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, themeable with navy/gold tokens |
| Database | Render PostgreSQL | Managed Postgres; native Row Level Security (RLS) is a first-class Postgres feature, not a Supabase exclusive |
| ORM | Prisma | Type-safe schema, migrations; still lets us write raw SQL for RLS policies (Prisma doesn't manage RLS itself) |
| Auth | NextAuth.js (Credentials + Google provider), bcrypt for password hashing, JWT session with DB session table | No Supabase Auth available; NextAuth on Postgres via Prisma adapter is the standard replacement |
| File storage | Render Persistent Disk, mounted at `/data`, served through an authenticated Next.js API route (never a public static path) | Replaces Supabase Storage; access control is enforced by our own route handler, not by the disk itself |
| Email | Resend | Unchanged from original spec |
| Admin phone OTP | Twilio Verify | Unchanged from original spec |
| Hosting | Render Web Service (app) + Render PostgreSQL (data) + Render Persistent Disk (files) | Per your requirement |

### Why this differs from a Supabase build
Supabase bundles Postgres + Auth + Storage + RLS behind one SDK. On Render we get plain managed Postgres and a persistent disk — no bundled auth/storage service. So:
- **Auth** is handled by NextAuth against our own `users`/`sessions` tables (via Prisma adapter).
- **Storage** is a disk directory instead of an object-storage bucket. Files are named by UUID, stored outside the web root, and only ever streamed to a client after a server-side permission check (ownership, approval status, premium status). This is *more* secure by default than a public bucket, at the cost of us writing the streaming route ourselves.
- **RLS** stays in the plan — plain Postgres supports `CREATE POLICY` / `ROW LEVEL SECURITY` natively. We enable it as defense-in-depth underneath Prisma, using a per-request Postgres role/session variable set to the current user's id and role. **Scope note (added in Phase 4/5):** RLS is enabled on `Document`, `Comment`, `Rating`, `Report`, `PremiumCode`, `AuditLog`, and `SiteSetting` — every table reached exclusively through our own hand-written routes. It is deliberately **not** enabled on `User`, `Account`, `Session`, or `VerificationToken`, because NextAuth's `PrismaAdapter` manages those directly and has no way to participate in our session-variable convention (an admin-only INSERT policy would break Google sign-in itself), and because Postgres RLS applies even to a table reached as a joined relation — a restrictive `User` policy would silently blank out legitimate reads like a document's uploader name or a comment's author name. Authorization for `User` data is enforced entirely at the application layer instead (every route checks `getCurrentUser()` and compares ids/roles explicitly, and every read uses an explicit Prisma `select` that only returns safe fields to anyone but the row's own owner or an admin). See `prisma/rls.sql` for the full reasoning inline.
- **No CDN edge caching of files** the way Supabase Storage gives you for free — acceptable at this stage; can add a CDN in front of the disk-serving route later without touching app logic.

### Left ready for later (per your instruction), not built now
- Custom domain wiring — Render supports this out of the box later; nothing in this architecture blocks it.
- SEO / Search Console — no `sitemap.xml`, no indexing meta, no robots allow-all yet. `robots.txt` will default to disallow-all during this phase so the app isn't indexed while unfinished.

## Phase plan (unchanged in spirit, adjusted for stack)

1. **Phase 1 (this delivery):** repo scaffold, Prisma schema for the full domain model, RLS policy SQL, NextAuth wiring (credentials + Google), theming tokens, folder structure for every planned page, `.env.example`, Render deployment notes.
2. Phase 2: scholar registration/login/forgot-password flows wired to real DB + Resend.
3. Phase 3: subjects/levels admin CRUD, document upload + pending-approval pipeline, secure file streaming route.
4. Phase 4: online PDF reader, comments, ratings, reporting.
5. Phase 5: premium codes (hashing, activation, expiration), premium documents view.
6. Phase 6: admin panel (dashboard, moderation, audit logs), admin auth with Twilio OTP.
7. Phase 7: polish — responsive pass, empty/error/loading states, WhatsApp + site settings.

## Important limitation of this environment
I'm building these files in a sandbox with no network access, so I cannot run `npm install`, spin up Postgres, or execute `next build` here to verify compilation. Everything is hand-written to be correct, but **the first thing to do on your machine or in Render's build step is `npm install && npx prisma generate && npm run build`** to catch anything before deploying. I'd recommend doing that verification pass before moving to Phase 2.
