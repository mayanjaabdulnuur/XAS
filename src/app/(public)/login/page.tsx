"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { FormField, inputClass, primaryButtonClass } from "@/components/FormField";

export default function LoginPage() {
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
      // Same message whether the email doesn't exist, the password is
      // wrong, or the account is suspended — never let a login form
      // confirm which accounts exist.
      setError("Incorrect email or password.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to continue your studies.">
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <FormField label="Email">
          <input type="email" name="email" className={inputClass} required />
        </FormField>
        <FormField label="Password">
          <input type="password" name="password" className={inputClass} required />
        </FormField>
        <div className="text-right mb-6">
          <Link href="/forgot-password" className="text-xas-gold text-sm">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px bg-white/10 flex-1" />
        <span className="text-white/40 text-xs">OR</span>
        <div className="h-px bg-white/10 flex-1" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full rounded-lg border border-white/20 py-2.5 text-white/90 hover:bg-white/5 transition-colors"
      >
        Continue with Google
      </button>

      <p className="text-center text-white/60 text-sm mt-6">
        New to XAS?{" "}
        <Link href="/register" className="text-xas-gold">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
