import { redirect } from "next/navigation";
import { withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { ScholarHeader } from "@/components/ScholarHeader";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const reviewedDocs = await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
    tx.document.findMany({
      where: { uploaderId: user.id, status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      select: { id: true, title: true, status: true, rejectionNote: true, reviewedAt: true },
    })
  );

  const myDocIds = reviewedDocs.map((d) => d.id);

  const recentComments =
    myDocIds.length === 0
      ? []
      : await withRlsContext({ userId: user.id, role: user.role }, (tx) =>
          tx.comment.findMany({
            where: { documentId: { in: myDocIds }, userId: { not: user.id }, isRemoved: false },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
              document: { select: { id: true, title: true } },
              user: { select: { firstName: true, lastName: true } },
            },
          })
        );

  type Item = { key: string; text: string; date: Date };
  const items: Item[] = [
    ...reviewedDocs
      .filter((d) => d.reviewedAt)
      .map((d) => ({
        key: `doc-${d.id}`,
        text:
          d.status === "APPROVED"
            ? `"${d.title}" was approved and is now visible to other scholars.`
            : `"${d.title}" was rejected${d.rejectionNote ? `: ${d.rejectionNote}` : "."}`,
        date: d.reviewedAt as Date,
      })),
    ...recentComments.map((c) => ({
      key: `comment-${c.id}`,
      text: `${c.user.firstName} ${c.user.lastName} commented on "${c.document.title}".`,
      date: c.createdAt,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <>
      <ScholarHeader userLabel={user.name ?? user.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-1">Notifications</h1>
        <p className="text-white/50 text-xs mb-6">
          Recent activity on your account — not a stored, dismissible notification queue. There is
          no Notification table in the schema; this is derived live from your documents and comments.
        </p>

        {items.length === 0 ? (
          <p className="text-white/50 text-sm">Nothing to show yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.key} className="rounded-xas border border-white/10 bg-xas-navy-light px-4 py-3">
                <p className="text-white/80 text-sm">{item.text}</p>
                <p className="text-white/40 text-xs mt-1">{item.date.toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
