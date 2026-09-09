import Link from "next/link";
import { withRlsContext } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { ReportStatusSelect } from "@/components/ReportStatusSelect";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  COPYRIGHT: "Copyright concern",
  INAPPROPRIATE: "Inappropriate content",
  INCORRECT_MISLEADING: "Incorrect/misleading",
  SPAM: "Spam",
  MALWARE_SECURITY: "Malware/security concern",
  DUPLICATE: "Duplicate",
  OTHER: "Other",
};

export default async function AdminReportsPage() {
  const admin = await requireVerifiedAdmin();

  const reports = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.report.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        document: { select: { id: true, title: true, status: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    })
  );

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Reports</h1>

        {reports.length === 0 ? (
          <p className="text-white/50 text-sm">No reports have been filed.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-xas border border-white/10 bg-xas-navy-light p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/documents/${r.document.id}`} className="text-white hover:text-xas-gold">
                      {r.document.title}
                    </Link>
                    <p className="text-white/50 text-xs mt-1">
                      {REASON_LABELS[r.reason]} · reported by {r.user.firstName} {r.user.lastName} (
                      {r.user.email})
                    </p>
                    {r.details && <p className="text-white/70 text-sm mt-2">{r.details}</p>}
                  </div>
                  <ReportStatusSelect reportId={r.id} initialStatus={r.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
