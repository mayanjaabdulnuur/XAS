import { prisma } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { ScholarTable } from "@/components/ScholarTable";

export const dynamic = "force-dynamic";

export default async function AdminScholarsPage() {
  const admin = await requireVerifiedAdmin();

  const scholars = await prisma.user.findMany({
    where: { role: "SCHOLAR" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      level: true,
      isSuspended: true,
      premiumStatus: true,
    },
  });

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Scholar Management</h1>
        <ScholarTable initialScholars={scholars} />
      </main>
    </>
  );
}
