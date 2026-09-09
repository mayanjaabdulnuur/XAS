import { withRlsContext } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { PremiumCodeManager } from "@/components/PremiumCodeManager";

export const dynamic = "force-dynamic";

export default async function AdminPremiumCodesPage() {
  const admin = await requireVerifiedAdmin();

  const codes = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.premiumCode.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        status: true,
        durationDays: true,
        createdAt: true,
        expiresAt: true,
        redeemedAt: true,
        redeemedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    })
  );

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Premium Codes</h1>
        <PremiumCodeManager
          initial={codes.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            expiresAt: c.expiresAt?.toISOString() ?? null,
            redeemedAt: c.redeemedAt?.toISOString() ?? null,
          }))}
        />
      </main>
    </>
  );
}
