"use client";

import { useState } from "react";

export function CommentDeleteButton({ commentId, label = "Remove" }: { commentId: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Remove this comment?")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setRemoved(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not remove comment.");
    }
  }

  if (removed) return <span className="text-xs text-white/40">Removed</span>;

  return (
    <div className="text-right">
      <button
        disabled={busy}
        onClick={handleDelete}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
      >
        {label}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
