import { PrismaClient, Prisma } from "@prisma/client";

// PrismaClient reads DATABASE_URL at construction time (to configure its
// engine), not just on first query — so a completely unset DATABASE_URL
// throws immediately when this module is imported, which happens simply
// by `next build` loading route modules to collect their metadata, even
// for routes that never actually run at build time. Render always injects
// DATABASE_URL for both its build and runtime steps, so this never matters
// in production — but `npm run build` locally/in Termux without a fully
// populated .env should still succeed, so we fall back to an inert
// placeholder that lets the client construct cleanly. It will fail with a
// normal connection error the moment a real query is attempted, which is
// the correct behavior — the fallback only exists to stop a missing env
// var from becoming a *build* failure instead of a *runtime* one.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://localhost:5432/xtream_unconfigured";
}

// Single shared PrismaClient (standard Next.js pattern to avoid exhausting
// connections in dev with hot-reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Runs `fn` inside a transaction with Postgres session variables set so the
 * RLS policies in prisma/rls.sql apply. ALWAYS use this (never the bare
 * `prisma` client) for any query that touches user-supplied data — this is
 * the defense-in-depth layer underneath our application-level auth checks.
 *
 * Usage:
 *   const docs = await withRlsContext(session, (tx) => tx.document.findMany());
 */
export async function withRlsContext<T>(
  ctx: { userId: string | null; role: "SCHOLAR" | "ADMIN" | null },
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // set_config with is_local=true scopes these to the current transaction only.
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_user_id', $1, true), set_config('app.current_role', $2, true)`,
      ctx.userId ?? "",
      ctx.role ?? ""
    );
    return fn(tx);
  });
}
