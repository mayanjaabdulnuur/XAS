import { withRlsContext } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const admin = await requireVerifiedAdmin();

  const logs = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { admin: { select: { firstName: true, lastName: true, email: true } } },
    })
  );

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email ?? ""} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Audit Logs</h1>

        {logs.length === 0 ? (
          <p className="text-white/50 text-sm">No admin actions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/50 text-xs border-b border-white/10">
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Admin</th>
                  <th className="py-2 pr-4">Target</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 align-top">
                    <td className="py-2 pr-4 text-white/60 whitespace-nowrap">
                      {log.createdAt.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-white whitespace-nowrap">{log.action}</td>
                    <td className="py-2 pr-4 text-white/70 whitespace-nowrap">
                      {log.admin ? `${log.admin.firstName} ${log.admin.lastName}` : "—"}
                    </td>
                    <td className="py-2 pr-4 text-white/60 whitespace-nowrap">
                      {log.targetType ? `${log.targetType}:${log.targetId}` : "—"}
                    </td>
                    <td className="py-2 text-white/50 text-xs max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
