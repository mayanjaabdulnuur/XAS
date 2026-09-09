import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { ScholarHeader } from "@/components/ScholarHeader";

export const dynamic = "force-dynamic";

export default async function OLevelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const subjects = await prisma.subject.findMany({
    where: { level: "O_LEVEL" },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <ScholarHeader userLabel={user.name ?? user.email} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-1">O Level Subjects</h1>
        <p className="text-white/60 text-sm mb-6">Browse notes, past papers, and study guides.</p>

        {subjects.length === 0 ? (
          <p className="text-white/50 text-sm">
            No O Level subjects yet — an administrator hasn&apos;t added any. Run{" "}
            <code className="text-xas-gold">npm run prisma:seed</code> for example subjects.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/subject/${s.slug}`}
                className="rounded-xas border border-white/10 bg-xas-navy-light p-4 hover:border-xas-gold/50 transition-colors"
              >
                <span className="text-white">{s.name}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
