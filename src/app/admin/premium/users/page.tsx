import { prisma } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { PremiumUserList } from "@/components/PremiumUserList";

export const dynamic = "force-dynamic";

export default async function AdminPremiumUsersPage() {
  const admin = await requireVerifiedAdmin();

  const users = await prisma.user.findMany({
    where: { premiumStatus: true },
    orderBy: { premiumExpires: "asc" },
    select: { id: true, firstName: true, lastName: true, email: true, premiumExpires: true },
  });

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Premium Users</h1>
        <PremiumUserList
          initial={users.map((u) => ({
            ...u,
            premiumExpires: u.premiumExpires?.toISOString() ?? null,
          }))}
        />
      </main>
    </>
  );
}
