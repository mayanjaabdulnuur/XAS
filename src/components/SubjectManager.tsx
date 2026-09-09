"use client";

import { useState, FormEvent } from "react";
import { inputClass, primaryButtonClass } from "./FormField";

type Subject = { id: string; name: string; level: "O_LEVEL" | "A_LEVEL"; slug: string };

export function SubjectManager({ initialSubjects }: { initialSubjects: Subject[] }) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = form.get("name")?.toString() ?? "";
    const level = form.get("level")?.toString() ?? "O_LEVEL";
    const slug = form.get("slug")?.toString() ?? "";

    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, level, slug }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create subject.");
      return;
    }
    setSubjects((prev) => [...prev, data.subject].sort((a, b) => a.name.localeCompare(b.name)));
    e.currentTarget.reset();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this subject? Subjects with existing documents can't be deleted.")) return;
    const res = await fetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not delete subject.");
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2 mb-6">
        <input name="name" placeholder="Subject name" required className={`${inputClass} flex-1 min-w-[140px]`} />
        <select name="level" className={inputClass} defaultValue="O_LEVEL">
          <option value="O_LEVEL">O Level</option>
          <option value="A_LEVEL">A Level</option>
        </select>
        <input name="slug" placeholder="url-slug" required className={`${inputClass} flex-1 min-w-[140px]`} />
        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-auto px-4`}>
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {subjects.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-xas border border-white/10 bg-xas-navy-light px-4 py-2.5"
          >
            <span className="text-white text-sm">
              {s.name} <span className="text-white/40 text-xs">({s.level === "O_LEVEL" ? "O" : "A"} Level · /{s.slug})</span>
            </span>
            <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-300">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
