"use client";

import { useState, FormEvent } from "react";
import { inputClass, primaryButtonClass } from "./FormField";

type Setting = { key: string; value: string };

export function SiteSettingsManager({ initial }: { initial: Setting[] }) {
  const [settings, setSettings] = useState<Record<string, string>>(
    Object.fromEntries(initial.map((s) => [s.key, s.value]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function saveSetting(key: string, value: string) {
    setSaving(key);
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) {
      setError(data.error ?? "Could not save.");
      return;
    }
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 2000);
  }

  function handleAddNew(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newKey.trim()) return;
    saveSetting(newKey.trim(), newValue.trim());
    setNewKey("");
    setNewValue("");
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-white/70 text-sm mb-1.5">WhatsApp contact number</label>
        <div className="flex gap-2">
          <input
            className={inputClass}
            defaultValue={settings.whatsapp_number ?? ""}
            placeholder="e.g. +256700000000"
            onBlur={(e) => {
              if (e.target.value !== (settings.whatsapp_number ?? "")) saveSetting("whatsapp_number", e.target.value);
            }}
          />
        </div>
        <p className="text-white/40 text-xs mt-1">
          {saving === "whatsapp_number"
            ? "Saving…"
            : savedKey === "whatsapp_number"
              ? "Saved."
              : "Shown to scholars who need to contact an admin about premium access."}
        </p>
      </div>

      <h2 className="text-white text-sm mb-2 mt-8">All settings</h2>
      <ul className="space-y-2 mb-6">
        {Object.entries(settings).map(([key, value]) => (
          <li key={key} className="rounded-xas border border-white/10 bg-xas-navy-light px-4 py-2.5">
            <p className="text-white/50 text-xs mb-1">{key}</p>
            <input
              className={`${inputClass} text-sm py-1.5`}
              defaultValue={value}
              onBlur={(e) => {
                if (e.target.value !== value) saveSetting(key, e.target.value);
              }}
            />
          </li>
        ))}
      </ul>

      <h2 className="text-white text-sm mb-2">Add a new setting</h2>
      <form onSubmit={handleAddNew} className="flex flex-wrap gap-2">
        <input
          placeholder="key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className={`${inputClass} w-40`}
        />
        <input
          placeholder="value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className={`${inputClass} flex-1 min-w-[160px]`}
        />
        <button type="submit" className={`${primaryButtonClass} w-auto px-4`}>
          Add
        </button>
      </form>
    </div>
  );
}
