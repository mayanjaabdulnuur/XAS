"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { ScholarHeader } from "@/components/ScholarHeader";
import { FormField, inputClass, primaryButtonClass } from "@/components/FormField";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
        confirmNewPassword: form.get("confirmNewPassword"),
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not change password.");
      return;
    }
    setSuccess(true);
    e.currentTarget.reset();
  }

  return (
    <>
      <ScholarHeader userLabel={session?.user?.name ?? session?.user?.email ?? ""} />
      <main className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Settings</h1>

        <h2 className="text-white text-sm mb-3">Change password</h2>
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-status-approved/10 border border-status-approved/30 px-3 py-2 text-status-approved text-sm">
            Password updated.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <FormField label="Current password">
            <input type="password" name="currentPassword" className={inputClass} required />
          </FormField>
          <FormField label="New password">
            <input type="password" name="newPassword" className={inputClass} required minLength={8} />
          </FormField>
          <FormField label="Confirm new password">
            <input type="password" name="confirmNewPassword" className={inputClass} required minLength={8} />
          </FormField>
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Saving…" : "Change password"}
          </button>
        </form>
      </main>
    </>
  );
}
