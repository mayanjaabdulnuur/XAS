import Link from "next/link";
import { redirect } from "next/navigation";
import { withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { ScholarHeader } from "@/components/ScholarHeader";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookmarks = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.bookmark.findMany({
      where: { userId: user.id, document: { status: "APPROVED" } },
      orderBy: { createdAt: "desc" },
      include: { document: { include: { subject: true } } },
    })
  );

  return (
    <>
      <ScholarHeader userLabel={user.name ?? user.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Bookmarks</h1>

        {bookmarks.length === 0 ? (
          <p className="text-white/50 text-sm">
            No bookmarks yet — open a document and tap &ldquo;Bookmark&rdquo; to save it here.
          </p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/document/${b.document.id}`}
                  className="flex items-center justify-between rounded-xas border border-white/10 bg-xas-navy-light px-4 py-3 hover:border-xas-gold/50 transition-colors"
                >
                  <span className="text-white">{b.document.title}</span>
                  <span className="text-xs text-white/50">{b.document.subject.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
