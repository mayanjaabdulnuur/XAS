import { notFound } from "next/navigation";
import { withRlsContext } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminDocumentActions } from "@/components/AdminDocumentActions";

export const dynamic = "force-dynamic";

export default async function AdminDocumentReviewPage({ params }: { params: { id: string } }) {
  const admin = await requireVerifiedAdmin();

  const document = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.document.findUnique({
      where: { id: params.id },
      include: {
        subject: true,
        uploader: { select: { firstName: true, lastName: true, email: true } },
      },
    })
  );

  if (!document) notFound();

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-xas-gold text-xs uppercase tracking-wide mb-1">
          {document.subject.name} · {document.resourceType.replace("_", " ")}
        </p>
        <h1 className="text-xl font-display text-white mb-2">{document.title}</h1>
        <p className="text-white/50 text-xs mb-4">
          Status: {document.status} · Uploaded by {document.uploader.firstName}{" "}
          {document.uploader.lastName} ({document.uploader.email}) on{" "}
          {document.createdAt.toLocaleDateString()}
        </p>
        {document.description && <p className="text-white/80 mb-4">{document.description}</p>}
        <dl className="text-sm text-white/60 grid grid-cols-2 gap-2 mb-4">
          <dt>File</dt>
          <dd className="text-white/80">
            {document.originalFilename} ({Math.round(document.fileSizeBytes / 1024)} KB)
          </dd>
          <dt>Views / Downloads</dt>
          <dd className="text-white/80">
            {document.viewCount} / {document.downloadCount}
          </dd>
          {document.rejectionNote && (
            <>
              <dt>Rejection note</dt>
              <dd className="text-status-rejected">{document.rejectionNote}</dd>
            </>
          )}
        </dl>

        <a
          href={`/api/documents/${document.id}/file?mode=view`}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-lg bg-xas-gold text-xas-navy-dark font-semibold px-4 py-2 text-sm mb-4"
        >
          Open document
        </a>

        <div className="rounded-xas border border-white/10 bg-xas-navy-light p-4">
          <AdminDocumentActions
            documentId={document.id}
            status={document.status}
            isPremium={document.isPremium}
          />
        </div>
      </main>
    </>
  );
}
