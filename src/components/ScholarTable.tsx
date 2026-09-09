"use client";

import { useState } from "react";
import { inputClass } from "./FormField";

type Scholar = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: "O_LEVEL" | "A_LEVEL" | null;
  isSuspended: boolean;
  premiumStatus: boolean;
};

export function ScholarTable({ initialScholars }: { initialScholars: Scholar[] }) {
  const [scholars, setScholars] = useState(initialScholars);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleSearch(q: string) {
    setQuery(q);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/scholars?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setScholars(data.scholars ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSuspend(id: string, suspend: boolean) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/scholars/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspend }),
      });
      if (res.ok) {
        setScholars((prev) => prev.map((s) => (s.id === id ? { ...s, isSuspended: suspend } : s)));
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <input
        className={`${inputClass} mb-4`}
        placeholder="Search by name or email…"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {loading && <p className="text-white/50 text-sm mb-2">Searching…</p>}

      {scholars.length === 0 ? (
        <p className="text-white/50 text-sm">No scholars match.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50 text-xs border-b border-white/10">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Level</th>
                <th className="py-2 pr-4">Premium</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {scholars.map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-white whitespace-nowrap">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="py-2 pr-4 text-white/70 whitespace-nowrap">{s.email}</td>
                  <td className="py-2 pr-4 text-white/70">{s.level ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {s.premiumStatus ? <span className="text-xas-gold">Yes</span> : "No"}
                  </td>
                  <td className="py-2 pr-4">
                    {s.isSuspended ? (
                      <span className="text-status-rejected">Suspended</span>
                    ) : (
                      <span className="text-status-approved">Active</span>
                    )}
                  </td>
                  <td className="py-2">
                    <button
                      disabled={busyId === s.id}
                      onClick={() => toggleSuspend(s.id, !s.isSuspended)}
                      className="text-xs rounded-md border border-white/20 px-2.5 py-1 text-white/80 hover:bg-white/5 disabled:opacity-50 whitespace-nowrap"
                    >
                      {s.isSuspended ? "Unsuspend" : "Suspend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
