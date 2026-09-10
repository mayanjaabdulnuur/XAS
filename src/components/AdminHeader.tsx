import Link from "next/link";
import { XasBadge } from "./XasBadge";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pending-approvals", label: "Approvals" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/scholars", label: "Scholars" },
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/combinations", label: "Combinations" },
  { href: "/admin/premium/codes", label: "Premium Codes" },
  { href: "/admin/premium/users", label: "Premium Users" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
];

export function AdminHeader({ adminLabel }: { adminLabel?: string | null }) {
  return (
    <header className="sticky top-0 z-10 bg-xas-navy-dark/95 backdrop-blur border-b border-xas-gold/20">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2.5">
        <Link href="/admin" className="flex items-center gap-2">
          <XasBadge size="sm" className="w-9 h-9 object-contain" />
          <span className="text-white font-display text-sm">
            XAS <span className="text-xas-gold">Admin</span>
          </span>
        </Link>
        <span className="text-white/50 text-xs">{adminLabel ?? ""}</span>
      </div>
      <nav className="max-w-6xl mx-auto flex gap-4 overflow-x-auto px-4 pb-2 text-xs text-white/70">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap hover:text-xas-gold transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
