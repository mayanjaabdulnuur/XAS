import Link from "next/link";
import { prisma, withRlsContext } from "@/server/db";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { AdminHeader } from "@/components/AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireVerifiedAdmin();

  const [pendingCount, scholarCount, documentCount, premiumUserCount, openReportCount] =
    await Promise.all([
      withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
        tx.document.count({ where: { status: "PENDING" } })
      ),
      prisma.user.count({ where: { role: "SCHOLAR" } }),
      withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) => tx.document.count()),
      prisma.user.count({ where: { premiumStatus: true } }),
      withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
        tx.report.count({ where: { status: "OPEN" } })
      ),
    ]);

  const stats = [
    { label: "Pending approvals", value: pendingCount, href: "/admin/pending-approvals" },
    { label: "Scholars", value: scholarCount, href: "/admin/scholars" },
    { label: "Total documents", value: documentCount, href: "/admin/documents" },
    { label: "Premium users", value: premiumUserCount, href: "/admin/premium/users" },
    { label: "Open reports", value: openReportCount, href: "/admin/reports" },
  ];

  return (
    <>
      <AdminHeader adminLabel={admin.name ?? admin.email} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xas border border-white/10 bg-xas-navy-light p-4 hover:border-xas-gold/50 transition-colors"
            >
              <p className="text-2xl text-xas-gold font-semibold">{stat.value}</p>
              <p className="text-white/60 text-xs mt-1">{stat.label}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
