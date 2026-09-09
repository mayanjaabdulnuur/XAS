import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma, withRlsContext } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { getWhatsappNumber } from "@/lib/site-settings";
import { ScholarHeader } from "@/components/ScholarHeader";
import { PremiumActivateForm } from "@/components/PremiumActivateForm";

export const dynamic = "force-dynamic";

export default async function PremiumPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  // Always re-check from the DB — the JWT session claim is never trusted
  // for anything premium-gated, same rule as the file-streaming route.
  // (The User table itself has no RLS — see prisma/rls.sql — so this
  // withRlsContext wrap isn't load-bearing here, but keeping the same
  // pattern everywhere avoids someone copying this as a counterexample.)
  const user = await withRlsContext({ userId: sessionUser.id, role: sessionUser.role }, (tx) =>
    tx.user.findUnique({
      where: { id: sessionUser.id },
      select: { premiumStatus: true, premiumExpires: true, firstName: true, email: true },
    })
  );

  const isActive = !!user?.premiumStatus && (!user.premiumExpires || user.premiumExpires > new Date());
  const whatsappNumber = await getWhatsappNumber();

  const documents = isActive
    ? await prisma.document.findMany({
        where: { isPremium: true, status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: { subject: true },
      })
    : [];

  return (
    <>
      <ScholarHeader userLabel={sessionUser.name ?? sessionUser.email} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-1">Premium Documents</h1>
        <p className="text-white/60 text-sm mb-6">
          All premium resources in one place — not split into separate subject folders.
        </p>

        {!isActive ? (
          <>
            {user?.premiumExpires && (
              <p className="text-status-pending text-sm mb-4">Your premium access has expired.</p>
            )}
            <PremiumActivateForm whatsappNumber={whatsappNumber} />
          </>
        ) : (
          <>
            <p className="text-xas-gold text-xs mb-4">
              Premium active
              {user?.premiumExpires ? ` until ${user.premiumExpires.toLocaleDateString()}` : ""}
            </p>
            {documents.length === 0 ? (
              <p className="text-white/50 text-sm">No premium documents have been approved yet.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/document/${doc.id}`}
                      className="flex items-center justify-between rounded-xas border border-white/10 bg-xas-navy-light px-4 py-3 hover:border-xas-gold/50 transition-colors"
                    >
                      <span className="text-white">{doc.title}</span>
                      <span className="text-xs text-white/50">
                        {doc.subject.name} · {doc.level === "O_LEVEL" ? "O Level" : "A Level"}
                        {doc.year ? ` · ${doc.year}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}
