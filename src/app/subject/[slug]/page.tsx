import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { ScholarHeader } from "@/components/ScholarHeader";

export const dynamic = "force-dynamic";

export default async function SubjectPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const subject = await prisma.subject.findUnique({ where: { slug: params.slug } });
  if (!subject) notFound();

  const documents = await prisma.document.findMany({
    where: { subjectId: subject.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <ScholarHeader userLabel={user.name ?? user.email} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-xas-gold text-xs uppercase tracking-wide mb-1">
          {subject.level === "O_LEVEL" ? "O Level" : "A Level"}
        </p>
        <h1 className="text-xl font-display text-white mb-6">{subject.name}</h1>

        {documents.length === 0 ? (
          <p className="text-white/50 text-sm">
            No approved resources yet for this subject.{" "}
            <Link href="/upload" className="text-xas-gold underline">
              Upload the first one
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/document/${doc.id}`}
                  className="flex items-center justify-between rounded-xas border border-white/10 bg-xas-navy-light px-4 py-3 hover:border-xas-gold/50 transition-colors"
                >
                  <span className="text-white">{doc.title}</span>
                  <span className="flex items-center gap-2 text-xs text-white/50">
                    {doc.isPremium && <span className="text-xas-gold">Premium</span>}
                    {doc.year && <span>{doc.year}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
