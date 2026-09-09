export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm text-white/80 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg bg-xas-navy border border-white/15 px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-xas-gold transition-colors";

export const primaryButtonClass =
  "w-full rounded-lg bg-xas-gold hover:bg-xas-gold-light text-xas-navy-dark font-semibold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
