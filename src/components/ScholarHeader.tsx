import Link from "next/link";
import { XasBadge } from "./XasBadge";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/o-level", label: "O Level" },
  { href: "/a-level", label: "A Level" },
  { href: "/search", label: "Search" },
  { href: "/premium", label: "Premium" },
  { href: "/my-uploads", label: "My Uploads" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/notifications", label: "Notifications" },
];

export function ScholarHeader({ userLabel }: { userLabel: string }) {
  return (
    <header className="sticky top-0 z-10 bg-xas-navy/95 backdrop-blur border-b border-white/10">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2.5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <XasBadge size="sm" className="w-9 h-9 object-contain" />
          <span className="hidden sm:inline text-white font-display text-sm">
            Xtream Advanced Scholars
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 overflow-x-auto text-sm text-white/70">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-xas-gold transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-white/50 text-xs">{userLabel}</span>
          <Link
            href="/profile"
            className="text-xs rounded-full border border-xas-gold/50 text-xas-gold px-3 py-1 hover:bg-xas-gold/10 transition-colors"
          >
            Profile
          </Link>
        </div>
      </div>
      {/* Mobile nav — horizontally scrollable rather than justify-around,
          since 8 items would be unreadably cramped in a fixed-width row on
          a phone screen. */}
      <nav className="md:hidden flex gap-4 overflow-x-auto border-t border-white/10 px-4 py-2 text-[11px] text-white/70">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-xas-gold transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
