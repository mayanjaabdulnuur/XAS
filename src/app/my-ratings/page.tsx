import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { ScholarHeader } from "@/components/ScholarHeader";

export const dynamic = "force-dynamic";

export default async function MyRatingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ratings = await prisma.rating.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { document: { select: { id: true, title: true, status: true } } },
  });

  return (
    <>
      <ScholarHeader userLabel={user.name ?? user.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">My Ratings</h1>

        {ratings.length === 0 ? (
          <p className="text-white/50 text-sm">You haven&apos;t rated any documents yet.</p>
        ) : (
          <ul className="space-y-2">
            {ratings.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xas border border-white/10 bg-xas-navy-light px-4 py-3"
              >
                <Link href={`/document/${r.document.id}`} className="text-white hover:text-xas-gold">
                  {r.document.title}
                </Link>
                <span className="text-xas-gold text-sm">
                  {"★".repeat(r.stars)}
                  {"☆".repeat(5 - r.stars)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
