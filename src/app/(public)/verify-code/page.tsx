"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { FormField, inputClass, primaryButtonClass } from "@/components/FormField";

export default function VerifyCodePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("xas-reset-email");
    if (!stored) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(stored);
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const code = new FormData(e.currentTarget).get("code")?.toString() ?? "";

    const res = await fetch("/api/auth/verify-reset-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "That code is invalid or has expired.");
      setSubmitting(false);
      return;
    }

    sessionStorage.setItem("xas-reset-token", data.resetToken);
    sessionStorage.removeItem("xas-reset-email");
    router.push("/reset-password");
  }

  return (
    <AuthCard title="Enter your code" subtitle={`We sent a 6-digit code to ${email || "your email"}. It expires in 10 minutes.`}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
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
          {submitting ? "Verifying…" : "Verify code"}
        </button>
      </form>
    </AuthCard>
  );
}
