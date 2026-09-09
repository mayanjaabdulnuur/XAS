import { prisma } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { CombinationManager } from "@/components/CombinationManager";

export const dynamic = "force-dynamic";

export default async function AdminCombinationsPage() {
  const admin = await requireVerifiedAdmin();
  const combinations = await prisma.aLevelCombination.findMany({ orderBy: { code: "asc" } });

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">A Level Combinations</h1>
        <CombinationManager initial={combinations} />
      </main>
    </>
  );
}
