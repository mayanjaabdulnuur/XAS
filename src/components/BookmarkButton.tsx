"use client";

import { useEffect, useState } from "react";

export function BookmarkButton({ documentId }: { documentId: string }) {
  const [bookmarked, setBookmarked] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/documents/${documentId}/bookmark`)
      .then((res) => res.json())
      .then((data) => setBookmarked(!!data.bookmarked))
      .catch(() => setBookmarked(false));
  }, [documentId]);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/bookmark`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setBookmarked(data.bookmarked);
    } finally {
      setBusy(false);
    }
  }

  if (bookmarked === null) return null;

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-lg border px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
        bookmarked
          ? "border-xas-gold bg-xas-gold/10 text-xas-gold"
          : "border-white/20 text-white/90 hover:bg-white/5"
      }`}
    >
      {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
    </button>
  );
}
