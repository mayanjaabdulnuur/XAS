import { prisma } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { SubjectManager } from "@/components/SubjectManager";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const admin = await requireVerifiedAdmin();
  const subjects = await prisma.subject.findMany({ orderBy: [{ level: "asc" }, { name: "asc" }] });

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Subject Management</h1>
        <SubjectManager initialSubjects={subjects} />
      </main>
    </>
  );
}
