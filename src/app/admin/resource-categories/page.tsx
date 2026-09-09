import { prisma } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";
import { ResourceCategoryManager } from "@/components/ResourceCategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminResourceCategoriesPage() {
  const admin = await requireVerifiedAdmin();
  const categories = await prisma.resourceCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Resource Categories</h1>
        <ResourceCategoryManager initial={categories} />
      </main>
    </>
  );
}
