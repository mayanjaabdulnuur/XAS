import Link from "next/link";
import { redirect } from "next/navigation";
import { withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { ScholarHeader } from "@/components/ScholarHeader";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "text-status-pending",
  APPROVED: "text-status-approved",
  REJECTED: "text-status-rejected",
  REMOVED: "text-white/40",
};

export default async function MyUploadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Must run under RLS context — this listing includes PENDING/REJECTED
  // rows, which the Document RLS policy only shows when
  // app.current_user_id matches the uploader.
  const documents = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.document.findMany({
      where: { uploaderId: user.id },
      orderBy: { createdAt: "desc" },
      include: { subject: true },
    })
  );

  return (
    <>
      <ScholarHeader userLabel={user.name ?? user.email} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-display text-white">My Uploads</h1>
          <Link
            href="/upload"
            className="rounded-lg bg-xas-gold hover:bg-xas-gold-light text-xas-navy-dark text-sm font-semibold px-3 py-1.5 transition-colors"
          >
            Upload new
          </Link>
        </div>

        {documents.length === 0 ? (
          <p className="text-white/50 text-sm">You haven&apos;t uploaded anything yet.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="rounded-xas border border-white/10 bg-xas-navy-light px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <Link href={`/document/${doc.id}`} className="text-white hover:text-xas-gold">
                    {doc.title}
                  </Link>
                  <span className={`text-xs font-medium ${STATUS_STYLES[doc.status]}`}>
                    {doc.status}
                  </span>
                </div>
                <p className="text-white/40 text-xs mt-1">{doc.subject.name}</p>
                {doc.status === "REJECTED" && doc.rejectionNote && (
                  <p className="text-status-rejected text-xs mt-1">Reason: {doc.rejectionNote}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
