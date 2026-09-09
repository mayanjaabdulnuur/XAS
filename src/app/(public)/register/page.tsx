"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { FormField, inputClass, primaryButtonClass } from "@/components/FormField";

type Combination = { id: string; code: string; name: string };

export default function RegisterPage() {
  const router = useRouter();
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [level, setLevel] = useState<"O_LEVEL" | "A_LEVEL">("O_LEVEL");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/combinations")
      .then((res) => res.json())
      .then((data) => setCombinations(data.combinations ?? []))
      .catch(() => setCombinations([]));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("level", level);
    const acceptTermsInput = form.elements.namedItem("acceptTerms") as HTMLInputElement | null;
    formData.set("acceptTerms", String(acceptTermsInput?.checked ?? false));

    try {
      const res = await fetch("/api/auth/register", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.issues?.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(data.issues.fieldErrors)) {
            if (Array.isArray(msgs) && msgs.length) fieldErrors[key] = msgs[0] as string;
          }
          setErrors(fieldErrors);
        }
        setFormError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      const email = formData.get("email")?.toString() ?? "";
      const password = formData.get("password")?.toString() ?? "";
      await signIn("credentials", { email, password, redirect: false });
      router.push("/dashboard");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Create your scholar account" subtitle="Join XAS to access study resources for your level.">
      {formError && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {formError}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First name" error={errors.firstName}>
            <input name="firstName" className={inputClass} required maxLength={80} />
          </FormField>
          <FormField label="Last name" error={errors.lastName}>
            <input name="lastName" className={inputClass} required maxLength={80} />
          </FormField>
        </div>

        <FormField label="Level" error={errors.level}>
          <select
            name="levelSelect"
            className={inputClass}
            value={level}
            onChange={(e) => setLevel(e.target.value as "O_LEVEL" | "A_LEVEL")}
          >
            <option value="O_LEVEL">O Level</option>
            <option value="A_LEVEL">A Level</option>
          </select>
        </FormField>

        {level === "A_LEVEL" && (
          <FormField label="A Level combination" error={errors.combinationId}>
            <select name="combinationId" className={inputClass} required defaultValue="">
              <option value="" disabled>
                Select your combination
              </option>
              {combinations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Email" error={errors.email}>
          <input type="email" name="email" className={inputClass} required maxLength={255} />
        </FormField>

        <FormField label="Password" error={errors.password}>
          <input type="password" name="password" className={inputClass} required minLength={8} />
        </FormField>

        <FormField label="Confirm password" error={errors.confirmPassword}>
          <input type="password" name="confirmPassword" className={inputClass} required minLength={8} />
        </FormField>

        <FormField label="Profile photo (optional)">
          <input
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp"
            className="w-full text-sm text-white/70"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setAvatarPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          {avatarPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Preview" className="mt-2 w-16 h-16 rounded-full object-cover" />
          )}
        </FormField>

        <label className="flex items-start gap-2 text-sm text-white/70 mb-6">
          <input type="checkbox" name="acceptTerms" className="mt-1" required />
          <span>
            I accept the{" "}
            <Link href="/terms" target="_blank" className="text-xas-gold underline">
              Terms of Use
            </Link>
            ,{" "}
            <Link href="/privacy" target="_blank" className="text-xas-gold underline">
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/upload-policy" target="_blank" className="text-xas-gold underline">
              Upload &amp; Copyright Policy
            </Link>
            .
          </span>
        </label>
        {errors.acceptTerms && <p className="text-red-400 text-xs -mt-4 mb-4">{errors.acceptTerms}</p>}

        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-white/60 text-sm mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-xas-gold">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
