"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthCard } from "@/components/AuthCard";
import { FormField, inputClass, primaryButtonClass } from "@/components/FormField";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = form.get("email")?.toString() ?? "";
    const password = form.get("password")?.toString() ?? "";

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Incorrect email or password.");
      setSubmitting(false);
      return;
    }

    // Whether this account is actually an admin is checked server-side on
    // the next page (requireVerifiedAdmin / the verify-phone page itself)
    // — never trust a client-side role check for authorization.
    router.push("/admin/verify-phone");
  }

  return (
    <AuthCard title="Administrator Login" subtitle="XAS Admin Panel — email, password, then a phone code.">
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <FormField label="Admin email">
          <input type="email" name="email" className={inputClass} required />
        </FormField>
        <FormField label="Password">
          <input type="password" name="password" className={inputClass} required />
        </FormField>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Checking…" : "Continue"}
        </button>
      </form>
    </AuthCard>
  );
}
