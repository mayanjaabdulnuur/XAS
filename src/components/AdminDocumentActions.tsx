"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  documentId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REMOVED";
  isPremium: boolean;
};

export function AdminDocumentActions({ documentId, status, isPremium }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);

  async function callAction(path: string, options?: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST", ...options });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const reason = new FormData(e.currentTarget).get("reason")?.toString() ?? "";
    await callAction(`/api/admin/documents/${documentId}/reject`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setShowRejectForm(false);
  }

  async function handleTogglePremium() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/documents/${documentId}/premium`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPremium: !isPremium }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleHardDelete() {
    if (!confirm("Permanently delete this document and its file? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/documents/${documentId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Delete failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {error && <p className="text-red-400 text-xs w-full">{error}</p>}

      {status === "PENDING" && (
        <>
          <button
            disabled={busy}
            onClick={() => callAction(`/api/admin/documents/${documentId}/approve`)}
            className="text-xs rounded-md bg-status-approved/20 text-status-approved px-2.5 py-1 hover:bg-status-approved/30 transition-colors disabled:opacity-50"
          >
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => setShowRejectForm((s) => !s)}
            className="text-xs rounded-md bg-status-rejected/20 text-status-rejected px-2.5 py-1 hover:bg-status-rejected/30 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}

      {status === "APPROVED" && (
        <button
          disabled={busy}
          onClick={() => callAction(`/api/admin/documents/${documentId}/remove`)}
          className="text-xs rounded-md bg-status-pending/20 text-status-pending px-2.5 py-1 hover:bg-status-pending/30 transition-colors disabled:opacity-50"
        >
          Remove from public view
        </button>
      )}

      {(status === "APPROVED" || status === "PENDING") && (
        <button
          disabled={busy}
          onClick={handleTogglePremium}
          className="text-xs rounded-md border border-xas-gold/40 text-xas-gold px-2.5 py-1 hover:bg-xas-gold/10 transition-colors disabled:opacity-50"
        >
          {isPremium ? "Unmark premium" : "Mark premium"}
        </button>
      )}

      <button
        disabled={busy}
        onClick={handleHardDelete}
        className="text-xs rounded-md border border-red-500/40 text-red-400 px-2.5 py-1 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        Delete permanently
      </button>

      {showRejectForm && (
        <form onSubmit={handleReject} className="w-full flex gap-2 mt-1">
          <input
            name="reason"
            required
            placeholder="Reason for rejection"
            className="flex-1 rounded-md bg-xas-navy border border-white/15 px-2 py-1 text-sm text-white"
          />
          <button
            type="submit"
            disabled={busy}
            className="text-xs rounded-md bg-status-rejected/30 text-white px-2.5 py-1"
          >
            Confirm
          </button>
        </form>
      )}
    </div>
  );
}
