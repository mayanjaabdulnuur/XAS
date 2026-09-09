"use client";

import { useEffect, useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { inputClass, primaryButtonClass } from "@/components/FormField";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  user: { firstName: string; lastName: string };
};

export function CommentsSection({ documentId }: { documentId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch(`/api/documents/${documentId}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => {});
  }

  useEffect(load, [documentId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/documents/${documentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Couldn't post your comment.");
      setSubmitting(false);
      return;
    }

    setBody("");
    setComments((prev) => [data.comment, ...prev]);
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  const currentUserId = session?.user?.id;

  return (
    <div className="mb-8">
      <h2 className="text-white font-display text-lg mb-3">Comments</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          className={inputClass}
          rows={2}
          maxLength={2000}
          placeholder="Add a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-auto px-4 mt-2`}>
          {submitting ? "Posting…" : "Post comment"}
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="text-white/40 text-sm">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xas border border-white/10 bg-xas-navy-light px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">
                  {c.user.firstName} {c.user.lastName}
                </span>
                {c.userId === currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-white/30 hover:text-red-400 text-xs"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-white/70 text-sm mt-1">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
