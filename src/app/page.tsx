import { XasBadge } from "@/components/XasBadge";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <XasBadge size="xl" priority className="w-32 h-32 sm:w-40 sm:h-40 object-contain" />
      <h1 className="text-2xl font-display text-white">Xtream Advanced Scholars</h1>
      <p className="tracking-widest text-xas-gold text-sm">LEARN • GROW • EXCEL</p>
      <p className="text-white/70 max-w-md">
        Registration, login, subjects, document upload/approval, comments,
        ratings, and premium access are live — see docs/PHASE_STATUS.md for
        exactly what&apos;s built so far.
      </p>
    </main>
  );
}
