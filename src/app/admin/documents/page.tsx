import Link from "next/link";
import { withRlsContext } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminDocumentActions } from "@/components/AdminDocumentActions";

export const dynamic = "force-dynamic";

const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED", "REMOVED"] as const;

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const admin = await requireVerifiedAdmin();
  const activeStatus = STATUS_TABS.includes(searchParams.status as (typeof STATUS_TABS)[number])
    ? (searchParams.status as (typeof STATUS_TABS)[number])
    : "ALL";

  const documents = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.document.findMany({
      where: activeStatus === "ALL" ? undefined : { status: activeStatus },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { subject: true, uploader: { select: { firstName: true, lastName: true, email: true } } },
    })
  );

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-4">All Documents</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab}
              href={tab === "ALL" ? "/admin/documents" : `/admin/documents?status=${tab}`}
              className={`text-xs rounded-full px-3 py-1 whitespace-nowrap border ${
                activeStatus === tab
                  ? "bg-xas-gold text-xas-navy-dark border-xas-gold font-semibold"
                  : "border-white/20 text-white/70"
              }`}
            >
              {tab}
            </Link>
          ))}
        </div>

        {documents.length === 0 ? (
          <p className="text-white/50 text-sm">No documents match this filter.</p>
        ) : (
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li key={doc.id} className="rounded-xas border border-white/10 bg-xas-navy-light p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/documents/${doc.id}`} className="text-white hover:text-xas-gold">
                      {doc.title}
                    </Link>
                    <p className="text-white/50 text-xs mt-1">
                      {doc.subject.name} · {doc.uploader.firstName} {doc.uploader.lastName} ·{" "}
                      {doc.viewCount} views · {doc.downloadCount} downloads
                    </p>
                  </div>
                  <span className="text-xs text-white/50 whitespace-nowrap">{doc.status}</span>
                </div>
                <AdminDocumentActions documentId={doc.id} status={doc.status} isPremium={doc.isPremium} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
