"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ScholarHeader } from "@/components/ScholarHeader";
import { inputClass, primaryButtonClass } from "@/components/FormField";

type DocumentResult = {
  id: string;
  title: string;
  level: "O_LEVEL" | "A_LEVEL";
  isPremium: boolean;
  subject: { name: string };
};

function SearchResults() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<DocumentResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialQuery) return;
    setLoading(true);
    fetch(`/api/documents?q=${encodeURIComponent(initialQuery)}`)
      .then((res) => res.json())
      .then((data) => setResults(data.documents ?? []))
      .finally(() => setLoading(false));
  }, [initialQuery]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <>
      <ScholarHeader userLabel={session?.user?.name ?? session?.user?.email ?? ""} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-4">Search</h1>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            className={inputClass}
            placeholder="Search by document title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className={`${primaryButtonClass} w-auto px-5`}>
            Search
          </button>
        </form>

        {loading && <p className="text-white/50 text-sm">Searching…</p>}

        {!loading && initialQuery && results.length === 0 && (
          <p className="text-white/50 text-sm">No approved documents match &ldquo;{initialQuery}&rdquo;.</p>
        )}

        <ul className="space-y-2">
          {results.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/document/${doc.id}`}
                className="flex items-center justify-between rounded-xas border border-white/10 bg-xas-navy-light px-4 py-3 hover:border-xas-gold/50 transition-colors"
              >
                <span className="text-white">{doc.title}</span>
                <span className="text-xs text-white/50">
                  {doc.subject.name} · {doc.level === "O_LEVEL" ? "O Level" : "A Level"}
                  {doc.isPremium && <span className="text-xas-gold ml-1">· Premium</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
