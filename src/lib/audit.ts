import { withRlsContext } from "@/server/db";
import type { AuditAction, Prisma } from "@prisma/client";

export async function logAdminAction(
  admin: { id: string; role: "SCHOLAR" | "ADMIN" },
  action: AuditAction,
  opts: { targetType?: string; targetId?: string; metadata?: Prisma.InputJsonValue; ipAddress?: string } = {}
) {
  await withRlsContext({ userId: admin.id, role: admin.role }, (tx) =>
    tx.auditLog.create({
      data: {
        action,
        adminId: admin.id,
        targetType: opts.targetType,
        targetId: opts.targetId,
        metadata: opts.metadata,
        ipAddress: opts.ipAddress,
      },
    })
  );
}
