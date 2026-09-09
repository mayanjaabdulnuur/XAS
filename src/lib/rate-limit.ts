import { prisma } from "@/server/db";

/**
 * Fixed-window rate limiter backed by Postgres so limits are correct even
 * with multiple app instances (an in-memory Map would be per-instance and
 * trivially bypassable on Render's autoscaling).
 *
 * Returns { allowed, remaining, retryAfterSeconds }.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitEntry.findUnique({ where: { key } });

    if (!existing) {
      await tx.rateLimitEntry.create({ data: { key, count: 1, windowStart: now } });
      return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    const windowAgeSeconds = (now.getTime() - existing.windowStart.getTime()) / 1000;

    if (windowAgeSeconds > windowSeconds) {
      // Window expired — reset.
      await tx.rateLimitEntry.update({
        where: { key },
        data: { count: 1, windowStart: now },
      });
      return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    if (existing.count >= limit) {
      const retryAfterSeconds = Math.ceil(windowSeconds - windowAgeSeconds);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    await tx.rateLimitEntry.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { allowed: true, remaining: limit - existing.count - 1, retryAfterSeconds: 0 };
  });
}

/** Best-effort client IP extraction behind Render's proxy. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}
