"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField, inputClass, primaryButtonClass } from "@/components/FormField";

export function AdminOtpForm() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/send-otp", { method: "POST" });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send code.");
      return;
    }
    setSent(true);
    setSendMessage(data.message);
  }

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const code = new FormData(e.currentTarget).get("code")?.toString() ?? "";
    const res = await fetch("/api/admin/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "That code is invalid or has expired.");
      return;
    }

    router.push("/admin");
  }

  if (!sent) {
    return (
      <div>
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
            {error}
          </div>
        )}
        <p className="text-white/70 text-sm mb-4">
          We&apos;ll send a 6-digit code by SMS to the phone number on file for your admin account.
        </p>
        <button onClick={handleSendCode} disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Sending…" : "Send code"}
        </button>
      </div>
    );
  }

  return (
    <div>
      {sendMessage && <p className="text-white/60 text-sm mb-4">{sendMessage}</p>}
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleVerify}>
        <FormField label="6-digit code">
          <input
            name="code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            className={`${inputClass} tracking-[0.5em] text-center text-lg`}
            required
          />
        </FormField>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Verifying…" : "Verify and continue"}
        </button>
      </form>
      <button
        type="button"
        onClick={handleSendCode}
        disabled={submitting}
        className="text-xas-gold text-sm mt-4"
      >
        Resend code
      </button>
    </div>
  );
}
