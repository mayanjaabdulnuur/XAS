"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { FormField, inputClass, primaryButtonClass } from "@/components/FormField";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("xas-reset-token");
    if (!stored) {
      router.replace("/forgot-password");
      return;
    }
    setResetToken(stored);
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = form.get("password")?.toString() ?? "";
    const confirmPassword = form.get("confirmPassword")?.toString() ?? "";

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, password, confirmPassword }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not reset your password.");
      setSubmitting(false);
      return;
    }

    sessionStorage.removeItem("xas-reset-token");
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <AuthCard title="Choose a new password">
      {done ? (
        <p className="text-white/80 text-sm">Password updated. Redirecting you to log in…</p>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <FormField label="New password">
              <input type="password" name="password" className={inputClass} required minLength={8} />
            </FormField>
            <FormField label="Confirm new password">
              <input type="password" name="confirmPassword" className={inputClass} required minLength={8} />
            </FormField>
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? "Saving…" : "Reset password"}
            </button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
