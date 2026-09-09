"use client";

import { useState, FormEvent } from "react";
import { inputClass, primaryButtonClass } from "./FormField";

type Combination = { id: string; code: string; name: string };

export function CombinationManager({ initial }: { initial: Combination[] }) {
  const [combinations, setCombinations] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const code = form.get("code")?.toString() ?? "";
    const name = form.get("name")?.toString() ?? "";

    const res = await fetch("/api/admin/combinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create combination.");
      return;
    }
    setCombinations((prev) => [...prev, data.combination].sort((a, b) => a.code.localeCompare(b.code)));
    e.currentTarget.reset();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this combination? Scholars using it will simply lose that reference.")) return;
    const res = await fetch(`/api/admin/combinations/${id}`, { method: "DELETE" });
    if (res.ok) setCombinations((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2 mb-6">
        <input name="code" placeholder="Code (e.g. PCM)" required className={`${inputClass} w-32`} />
        <input
          name="name"
          placeholder="Full name (e.g. Physics, Chemistry, Mathematics)"
          required
          className={`${inputClass} flex-1 min-w-[200px]`}
        />
        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-auto px-4`}>
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {combinations.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-xas border border-white/10 bg-xas-navy-light px-4 py-2.5"
          >
            <span className="text-white text-sm">
              <span className="text-xas-gold">{c.code}</span> — {c.name}
            </span>
            <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-300">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
