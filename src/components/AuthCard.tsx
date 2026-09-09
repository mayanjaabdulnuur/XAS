import Link from "next/link";
import { XasBadge } from "./XasBadge";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="flex flex-col items-center gap-2 mb-6">
        <XasBadge size="lg" priority className="w-24 h-24 sm:w-28 sm:h-28 object-contain" />
        <span className="tracking-widest text-xas-gold text-[10px]">LEARN • GROW • EXCEL</span>
      </Link>
      <div className="w-full max-w-md bg-xas-navy-light rounded-xas border border-white/10 p-6 sm:p-8">
        <h1 className="text-xl font-display text-white mb-1">{title}</h1>
        {subtitle && <p className="text-white/60 text-sm mb-6">{subtitle}</p>}
        {children}
      </div>
    </main>
  );
}
