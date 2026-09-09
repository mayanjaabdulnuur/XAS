"use client";

import dynamic from "next/dynamic";

// next/dynamic's ssr:false is only permitted inside a Client Component
// module (this file) — not directly inside the Server Component page that
// renders it. pdfjs relies on browser-only APIs (canvas, DOMMatrix) that
// don't exist during server rendering, so this must never be prerendered.
export const PdfReaderLoader = dynamic(
  () => import("./DocumentReader").then((mod) => mod.DocumentReader),
  {
    ssr: false,
    loading: () => <p className="text-white/50 text-sm py-6">Loading reader…</p>,
  }
);
