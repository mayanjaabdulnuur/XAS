"use client";

import { useEffect, useState } from "react";

export function RatingWidget({ documentId }: { documentId: string }) {
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch(`/api/documents/${documentId}/ratings`)
      .then((res) => res.json())
      .then((data) => {
        setAverage(data.average ?? 0);
        setCount(data.count ?? 0);
        setMyRating(data.myRating ?? null);
      })
      .catch(() => {});
  }

  useEffect(load, [documentId]);

  async function submitRating(stars: number) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars }),
      });
      if (res.ok) {
        setMyRating(stars);
        load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const displayValue = hover ?? myRating ?? 0;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={submitting}
              onMouseEnter={() => setHover(star)}
              onClick={() => submitRating(star)}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              className={`text-2xl leading-none px-0.5 ${
                star <= displayValue ? "text-xas-gold" : "text-white/20"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-white/50 text-sm">
          {average.toFixed(1)} ({count} rating{count === 1 ? "" : "s"})
        </span>
      </div>
      {myRating && (
        <p className="text-white/40 text-xs mt-1">
          You rated this {myRating} star{myRating > 1 ? "s" : ""}.
        </p>
      )}
    </div>
  );
}
