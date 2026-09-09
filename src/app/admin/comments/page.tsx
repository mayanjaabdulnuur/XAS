import Link from "next/link";
import { withRlsContext } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { CommentDeleteButton } from "@/components/CommentDeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const admin = await requireVerifiedAdmin();

  const comments = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.comment.findMany({
      where: { isRemoved: false },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        document: { select: { id: true, title: true } },
      },
    })
  );

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-1">Comment Moderation</h1>
        <p className="text-white/50 text-xs mb-6">
          Most recent 100 comments across all documents. There&apos;s no separate
          &ldquo;reported comments&rdquo; queue — reports are per-document (see Reports) — so this is a
          direct moderation feed rather than a triage list.
        </p>

        {comments.length === 0 ? (
          <p className="text-white/50 text-sm">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xas border border-white/10 bg-xas-navy-light p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white/50 text-xs mb-1">
                      {c.user.firstName} {c.user.lastName} on{" "}
                      <Link href={`/admin/documents/${c.document.id}`} className="text-xas-gold">
                        {c.document.title}
                      </Link>
                    </p>
                    <p className="text-white/80 text-sm">{c.body}</p>
                  </div>
                  <CommentDeleteButton commentId={c.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
