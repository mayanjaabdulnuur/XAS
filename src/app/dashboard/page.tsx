import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ScholarHeader } from "@/components/ScholarHeader";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <ScholarHeader userLabel={user.name ?? user.email} />
      <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
        <h1 className="text-xl font-display text-white mb-2">Welcome, {user.name ?? user.email}</h1>
        <p className="text-white/60 text-sm">
          You&apos;re signed in as a {user.role === "ADMIN" ? "administrator" : "scholar"}. Subjects,
          document uploads, and premium documents are being wired up this phase — see
          docs/PHASE_STATUS.md for current status.
        </p>
      </main>
    </>
  );
}
