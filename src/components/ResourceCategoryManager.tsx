"use client";

import { useState, FormEvent } from "react";
import { inputClass, primaryButtonClass } from "./FormField";

type Category = { id: string; name: string };

export function ResourceCategoryManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const name = new FormData(e.currentTarget).get("name")?.toString() ?? "";

    const res = await fetch("/api/admin/resource-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create category.");
      return;
    }
    setCategories((prev) => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)));
    e.currentTarget.reset();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/resource-categories/${id}`, { method: "DELETE" });
    if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <p className="text-white/50 text-xs mb-4">
        Note: document uploads currently use a fixed resource-type list (Notes, Past Paper, Revision
        Material, Study Guide, Other) — these categories aren&apos;t wired into the upload form yet.
        This list is here for future use.
      </p>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input name="name" placeholder="Category name" required className={`${inputClass} flex-1`} />
        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-auto px-4`}>
          Add
        </button>
      </form>
      <ul className="space-y-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-xas border border-white/10 bg-xas-navy-light px-4 py-2.5"
          >
            <span className="text-white text-sm">{c.name}</span>
            <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-300">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
