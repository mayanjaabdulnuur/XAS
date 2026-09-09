"use client";

import { useState, FormEvent } from "react";
import { inputClass, primaryButtonClass } from "@/components/FormField";

const REASONS: { value: string; label: string }[] = [
  { value: "COPYRIGHT", label: "Copyright concern" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "INCORRECT_MISLEADING", label: "Incorrect / misleading material" },
  { value: "SPAM", label: "Spam" },
  { value: "MALWARE_SECURITY", label: "Malware / security concern" },
  { value: "DUPLICATE", label: "Duplicate" },
  { value: "OTHER", label: "Other" },
];

export function ReportButton({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await fetch(`/api/documents/${documentId}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: formData.get("reason"),
        details: formData.get("details"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't submit your report.");
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-white/20 text-white/70 hover:text-red-400 hover:border-red-400/50 px-4 py-2 text-sm transition-colors"
      >
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-20 bg-black/60 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-xas-navy-light rounded-xas border border-white/10 p-5">
            {done ? (
              <>
                <p className="text-white text-sm mb-4">
                  Thanks — your report has been sent to the administrators for review.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setDone(false);
                  }}
                  className={primaryButtonClass}
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="text-white font-display mb-3">Report this document</h3>
                {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
                <select name="reason" className={`${inputClass} mb-3`} required defaultValue="">
                  <option value="" disabled>
                    Select a reason
                  </option>
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <textarea
                  name="details"
                  className={`${inputClass} mb-3`}
                  rows={3}
                  maxLength={1000}
                  placeholder="Additional details (optional)"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className={primaryButtonClass}>
                    {submitting ? "Submitting…" : "Submit report"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-white/20 text-white/70 px-4 py-2.5 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
