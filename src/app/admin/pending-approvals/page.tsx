import Link from "next/link";
import { withRlsContext } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminDocumentActions } from "@/components/AdminDocumentActions";

export const dynamic = "force-dynamic";

export default async function PendingApprovalsPage() {
  const admin = await requireVerifiedAdmin();

  const documents = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.document.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { subject: true, uploader: { select: { firstName: true, lastName: true, email: true } } },
    })
  );

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-1">Pending Approvals</h1>
        <p className="text-white/60 text-sm mb-6">{documents.length} document(s) awaiting review.</p>

        {documents.length === 0 ? (
          <p className="text-white/50 text-sm">Nothing pending right now.</p>
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
                      {doc.subject.name} · {doc.resourceType.replace("_", " ")} · uploaded by{" "}
                      {doc.uploader.firstName} {doc.uploader.lastName} ({doc.uploader.email})
                    </p>
                  </div>
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
