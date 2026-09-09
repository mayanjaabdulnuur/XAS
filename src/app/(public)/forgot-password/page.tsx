"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { FormField, inputClass, primaryButtonClass } from "@/components/FormField";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const email = new FormData(e.currentTarget).get("email")?.toString() ?? "";

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMessage(data.message);
    setSubmitting(false);

    // Carry the email forward to the verify-code step without putting it
    // in the URL. Not putting the code itself here — that only ever lives
    // in the user's inbox.
    sessionStorage.setItem("xas-reset-email", email);
    setTimeout(() => router.push("/verify-code"), 1200);
  }

  return (
    <AuthCard title="Reset your password" subtitle="Enter your account email and we'll send a reset code.">
      {message ? (
        <p className="text-white/80 text-sm">{message}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormField label="Email">
            <input type="email" name="email" className={inputClass} required />
          </FormField>
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Sending…" : "Send reset code"}
          </button>
        </form>
      )}
      <p className="text-center text-white/60 text-sm mt-6">
        Remembered your password?{" "}
        <Link href="/login" className="text-xas-gold">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
