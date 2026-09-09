"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { inputClass, primaryButtonClass } from "@/components/FormField";

export function PremiumActivateForm({ whatsappNumber }: { whatsappNumber: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const code = new FormData(e.currentTarget).get("code")?.toString() ?? "";

    const res = await fetch("/api/premium/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "That code isn't valid.");
      setSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="rounded-xas border border-white/10 bg-xas-navy-light p-5 max-w-sm">
      <h2 className="text-white font-display mb-1">Activate premium access</h2>
      <p className="text-white/60 text-sm mb-4">Enter the access code you received from XAS.</p>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          name="code"
          placeholder="XAS-XXXX-XXXX"
          className={`${inputClass} mb-3 uppercase tracking-wide`}
          required
        />
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Activating…" : "Activate"}
        </button>
      </form>

      {whatsappNumber && (
        <p className="text-white/50 text-xs">
          Don&apos;t have a code?{" "}
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-xas-gold underline"
          >
            Contact an administrator on WhatsApp
          </a>
          .
        </p>
      )}
    </div>
  );
}
