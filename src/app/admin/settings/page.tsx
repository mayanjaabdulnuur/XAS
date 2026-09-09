import { prisma } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { SiteSettingsManager } from "@/components/SiteSettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await requireVerifiedAdmin();
  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Site Settings</h1>
        <SiteSettingsManager initial={settings} />
      </main>
    </>
  );
}
