import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { ScholarHeader } from "@/components/ScholarHeader";
import { CommentDeleteButton } from "@/components/CommentDeleteButton";

export const dynamic = "force-dynamic";

export default async function MyCommentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const comments = await prisma.comment.findMany({
    where: { userId: user.id, isRemoved: false },
    orderBy: { createdAt: "desc" },
    include: { document: { select: { id: true, title: true } } },
  });

  return (
    <>
      <ScholarHeader userLabel={user.name ?? user.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">My Comments</h1>

        {comments.length === 0 ? (
          <p className="text-white/50 text-sm">You haven&apos;t commented on any documents yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xas border border-white/10 bg-xas-navy-light p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/document/${c.document.id}`} className="text-xas-gold text-xs">
                      {c.document.title}
                    </Link>
                    <p className="text-white/80 text-sm mt-1">{c.body}</p>
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
