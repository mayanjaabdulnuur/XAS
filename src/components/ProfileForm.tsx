"use client";

import { useState, FormEvent } from "react";
import { FormField, inputClass, primaryButtonClass } from "./FormField";

type Props = {
  userId: string;
  firstName: string;
  lastName: string;
  avatarPath: string | null;
};

export function ProfileForm({ userId, firstName, lastName, avatarPath }: Props) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    avatarPath ? `/api/avatar/${userId}` : null
  );
  const [nameSaved, setNameSaved] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleNameSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNameSaved(false);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save.");
      return;
    }
    setNameSaved(true);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarSaving(true);
    setError(null);
    const formData = new FormData();
    formData.set("avatar", file);

    const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
    const data = await res.json();
    setAvatarSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Could not upload photo.");
      return;
    }
    setAvatarPreview(`/api/avatar/${userId}?t=${Date.now()}`);
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        {avatarPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-xas-navy-light border border-white/10" />
        )}
        <div>
          <label className="text-xas-gold text-sm cursor-pointer">
            {avatarSaving ? "Uploading…" : "Change photo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={avatarSaving}
            />
          </label>
        </div>
      </div>

      <form onSubmit={handleNameSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First name">
            <input name="firstName" defaultValue={firstName} className={inputClass} required maxLength={80} />
          </FormField>
          <FormField label="Last name">
            <input name="lastName" defaultValue={lastName} className={inputClass} required maxLength={80} />
          </FormField>
        </div>
        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-auto px-5`}>
          {submitting ? "Saving…" : "Save changes"}
        </button>
        {nameSaved && <span className="text-status-approved text-sm ml-3">Saved.</span>}
      </form>
    </div>
  );
}
