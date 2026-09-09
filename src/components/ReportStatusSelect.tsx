"use client";

import { useState } from "react";

const STATUSES = ["OPEN", "REVIEWED", "DISMISSED", "ACTIONED"] as const;

export function ReportStatusSelect({
  reportId,
  initialStatus,
}: {
  reportId: string;
  initialStatus: (typeof STATUSES)[number];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  async function handleChange(newStatus: (typeof STATUSES)[number]) {
    setBusy(true);
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(false);
    if (res.ok) setStatus(newStatus);
  }

  return (
    <select
      value={status}
      disabled={busy}
      onChange={(e) => handleChange(e.target.value as (typeof STATUSES)[number])}
      className="text-xs rounded-md bg-xas-navy border border-white/20 px-2 py-1 text-white disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
