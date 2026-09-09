import { notFound, redirect } from "next/navigation";
import { withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { ScholarHeader } from "@/components/ScholarHeader";
import { CommentsSection } from "@/components/CommentsSection";
import { RatingWidget } from "@/components/RatingWidget";
import { ReportButton } from "@/components/ReportButton";
import { PdfReaderLoader } from "@/components/PdfReaderLoader";
import { BookmarkButton } from "@/components/BookmarkButton";

export const dynamic = "force-dynamic";

export default async function DocumentDetailsPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Must run under RLS context — a PENDING/REJECTED document is only
  // visible here to its uploader or an admin, per the Document RLS policy.
  const document = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.document.findUnique({
      where: { id: params.id },
      include: { subject: true, uploader: { select: { firstName: true, lastName: true } } },
    })
  );

  if (!document) notFound();

  const isOwner = document.uploaderId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (document.status !== "APPROVED" && !isOwner && !isAdmin) notFound();

  const isApproved = document.status === "APPROVED";
  const isPdf = document.mimeType === "application/pdf";

  return (
    <>
      <ScholarHeader userLabel={user.name ?? user.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-xas-gold text-xs uppercase tracking-wide mb-1">
          {document.subject.name} · {document.resourceType.replace("_", " ")}
        </p>
        <h1 className="text-xl font-display text-white mb-2">{document.title}</h1>
        <p className="text-white/50 text-xs mb-4">
          Uploaded by {document.uploader.firstName} {document.uploader.lastName}
          {document.year ? ` · ${document.year}` : ""}
          {document.status !== "APPROVED" && (
            <span className="ml-2 text-status-pending">({document.status.toLowerCase()})</span>
          )}
        </p>
        {document.description && <p className="text-white/80 mb-6">{document.description}</p>}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <a
            href={`/api/documents/${document.id}/file?mode=download`}
            className="rounded-lg bg-xas-gold hover:bg-xas-gold-light text-xas-navy-dark font-semibold px-4 py-2 text-sm transition-colors"
          >
            Download
          </a>
          {!isPdf && (
            <a
              href={`/api/documents/${document.id}/file?mode=view`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/20 text-white/90 hover:bg-white/5 px-4 py-2 text-sm transition-colors"
            >
              Open document
            </a>
          )}
          {isApproved && <ReportButton documentId={document.id} />}
          {isApproved && <BookmarkButton documentId={document.id} />}
        </div>

        <p className="text-white/40 text-xs mb-6">
          {document.viewCount} views · {document.downloadCount} downloads
        </p>

        {isPdf ? (
          <PdfReaderLoader documentId={document.id} />
        ) : (
          <p className="text-white/40 text-sm mb-6">
            This file type doesn&apos;t have an in-page reader — use Open document or Download
            above.
          </p>
        )}

        {isApproved ? (
          <>
            <RatingWidget documentId={document.id} />
            <CommentsSection documentId={document.id} />
          </>
        ) : (
          <p className="text-white/30 text-xs mt-8">
            Ratings and comments open once this document is approved.
          </p>
        )}
      </main>
    </>
  );
}
