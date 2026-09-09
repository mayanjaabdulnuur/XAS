"use client";

import { useState } from "react";

type PremiumUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  premiumExpires: string | null;
};

export function PremiumUserList({ initial }: { initial: PremiumUser[] }) {
  const [users, setUsers] = useState(initial);

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this user's premium access?")) return;
    const res = await fetch(`/api/admin/premium-users/${id}/revoke`, { method: "POST" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  if (users.length === 0) {
    return <p className="text-white/50 text-sm">No scholars currently have premium access.</p>;
  }

  return (
    <ul className="space-y-2">
      {users.map((u) => (
        <li
          key={u.id}
          className="flex items-center justify-between rounded-xas border border-white/10 bg-xas-navy-light px-4 py-3"
        >
          <div>
            <p className="text-white text-sm">
              {u.firstName} {u.lastName} <span className="text-white/40">({u.email})</span>
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {u.premiumExpires
                ? `Expires ${new Date(u.premiumExpires).toLocaleDateString()}`
                : "No expiration"}
            </p>
          </div>
          <button onClick={() => handleRevoke(u.id)} className="text-xs text-red-400 hover:text-red-300">
            Revoke
          </button>
        </li>
      ))}
    </ul>
  );
}
