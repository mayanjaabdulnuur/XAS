"use client";

import { useState, FormEvent } from "react";
import { inputClass, primaryButtonClass } from "./FormField";

type Code = {
  id: string;
  label: string | null;
  status: "ACTIVE" | "USED" | "REVOKED" | "EXPIRED";
  durationDays: number | null;
  createdAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  redeemedBy: { firstName: string; lastName: string; email: string } | null;
};

export function PremiumCodeManager({ initial }: { initial: Code[] }) {
  const [codes, setCodes] = useState(initial);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setJustCreated(null);

    const durationRaw = new FormData(e.currentTarget).get("durationDays")?.toString() ?? "none";
    const durationDays = durationRaw === "none" ? "none" : Number(durationRaw);

    const res = await fetch("/api/admin/premium-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationDays }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create code.");
      return;
    }

    setJustCreated(data.code);
    setCodes((prev) => [
      {
        id: data.id,
        label: data.label,
        status: "ACTIVE",
        durationDays: data.durationDays,
        createdAt: data.createdAt,
        expiresAt: null,
        redeemedAt: null,
        redeemedBy: null,
      },
      ...prev,
    ]);
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this code? If already redeemed, that scholar's premium access is removed too.")) return;
    const res = await fetch(`/api/admin/premium-codes/${id}/revoke`, { method: "POST" });
    if (res.ok) {
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, status: "REVOKED" } : c)));
    }
  }

  return (
    <div>
      {justCreated && (
        <div className="mb-6 rounded-lg bg-xas-gold/10 border border-xas-gold/40 px-4 py-3">
          <p className="text-white/70 text-xs mb-1">
            Copy this code now — it is shown only once and cannot be retrieved again:
          </p>
          <p className="text-2xl font-mono text-xas-gold tracking-wider">{justCreated}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2 mb-6">
        <div>
          <label className="block text-white/70 text-xs mb-1">Duration</label>
          <select name="durationDays" className={inputClass} defaultValue="30">
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="none">No expiration</option>
          </select>
        </div>
        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-auto px-4`}>
          {submitting ? "Creating…" : "Create code"}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/50 text-xs border-b border-white/10">
              <th className="py-2 pr-4">Code (masked)</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Duration</th>
              <th className="py-2 pr-4">Redeemed by</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-white/80">{c.label}</td>
                <td className="py-2 pr-4">{c.status}</td>
                <td className="py-2 pr-4 text-white/70">
                  {c.durationDays ? `${c.durationDays}d` : "No expiry"}
                </td>
                <td className="py-2 pr-4 text-white/70 whitespace-nowrap">
                  {c.redeemedBy ? `${c.redeemedBy.firstName} ${c.redeemedBy.lastName}` : "—"}
                </td>
                <td className="py-2">
                  {c.status === "ACTIVE" || c.status === "USED" ? (
                    <button
                      onClick={() => handleRevoke(c.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Revoke
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
