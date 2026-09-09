"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField, inputClass, primaryButtonClass } from "@/components/FormField";
import { ScholarHeader } from "@/components/ScholarHeader";
import { useSession } from "next-auth/react";

type Subject = { id: string; name: string; level: "O_LEVEL" | "A_LEVEL" };

export default function UploadPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [level, setLevel] = useState<"O_LEVEL" | "A_LEVEL">("O_LEVEL");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/subjects?level=${level}`)
      .then((res) => res.json())
      .then((data) => setSubjects(data.subjects ?? []))
      .catch(() => setSubjects([]));
  }, [level]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("level", level);
    const confirmInput = e.currentTarget.elements.namedItem("copyrightConfirmed") as HTMLInputElement | null;
    formData.set("copyrightConfirmed", String(confirmInput?.checked ?? false));

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.issues?.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(data.issues.fieldErrors)) {
            if (Array.isArray(msgs) && msgs.length) fieldErrors[key] = msgs[0] as string;
          }
          setErrors(fieldErrors);
        }
        setFormError(data.error ?? "Upload failed. Please try again.");
        return;
      }

      router.push("/my-uploads");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ScholarHeader userLabel={session?.user?.name ?? session?.user?.email ?? ""} />
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-1">Upload a document</h1>
        <p className="text-white/60 text-sm mb-6">
          Every upload is reviewed by an administrator before other scholars can see it.
        </p>

        {formError && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField label="Title" error={errors.title}>
            <input name="title" className={inputClass} required maxLength={200} />
          </FormField>

          <FormField label="Description (optional)">
            <textarea name="description" className={inputClass} rows={3} maxLength={2000} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Level">
              <select
                className={inputClass}
                value={level}
                onChange={(e) => setLevel(e.target.value as "O_LEVEL" | "A_LEVEL")}
              >
                <option value="O_LEVEL">O Level</option>
                <option value="A_LEVEL">A Level</option>
              </select>
            </FormField>
            <FormField label="Resource type" error={errors.resourceType}>
              <select name="resourceType" className={inputClass} defaultValue="NOTES">
                <option value="NOTES">Notes</option>
                <option value="PAST_PAPER">Past paper</option>
                <option value="REVISION_MATERIAL">Revision material</option>
                <option value="STUDY_GUIDE">Study guide</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>
          </div>

          <FormField label="Subject" error={errors.subjectId}>
            <select name="subjectId" className={inputClass} required defaultValue="">
              <option value="" disabled>
                Select a subject
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Year (optional)">
            <input name="year" type="number" min={1990} max={2100} className={inputClass} />
          </FormField>

          <FormField label="File (PDF, DOCX, PPTX, XLSX, or image)" error={errors.file}>
            <input
              type="file"
              name="file"
              accept=".pdf,.docx,.pptx,.xlsx,image/png,image/jpeg,image/webp"
              className="w-full text-sm text-white/70"
              required
            />
          </FormField>

          <label className="flex items-start gap-2 text-sm text-white/70 mb-6">
            <input type="checkbox" name="copyrightConfirmed" className="mt-1" required />
            <span>
              I confirm that I have the right or permission to share this document and that it
              complies with the{" "}
              <Link href="/terms" target="_blank" className="text-xas-gold underline">
                XAS Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/upload-policy" target="_blank" className="text-xas-gold underline">
                Upload &amp; Copyright Policy
              </Link>
              .
            </span>
          </label>
          {errors.copyrightConfirmed && (
            <p className="text-red-400 text-xs -mt-4 mb-4">{errors.copyrightConfirmed}</p>
          )}

          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Uploading…" : "Submit for review"}
          </button>
        </form>
      </main>
    </>
  );
}
