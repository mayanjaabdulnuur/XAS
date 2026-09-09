"use client";

import { useCallback, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// pdfjs needs its worker script; unpkg mirrors the exact version react-pdf
// ships with so the API version always matches the worker version.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export function DocumentReader({ documentId }: { documentId: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fileUrl = `/api/documents/${documentId}/file?mode=view`;

  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPageNumber(1);
  }, []);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(() => {
        // Fullscreen can be denied by the browser/OS — not fatal, the
        // reader still works at normal size.
      });
    }
  }

  return (
    <div className="mb-8">
      <div
        ref={containerRef}
        className="rounded-xas border border-white/10 bg-xas-navy-dark overflow-auto max-h-[70vh] flex justify-center p-3"
      >
        {loadError ? (
          <p className="text-white/50 text-sm py-10">{loadError}</p>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onLoadSuccess}
            onLoadError={() => setLoadError("Couldn't load this document for preview. Try Download instead.")}
            loading={<p className="text-white/50 text-sm py-10">Loading document…</p>}
          >
            <Page pageNumber={pageNumber} scale={scale} renderAnnotationLayer={false} renderTextLayer={false} />
          </Document>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-sm text-white/70">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            className="rounded border border-white/20 px-2 py-1 disabled:opacity-30"
          >
            Prev
          </button>
          <span>
            Page {pageNumber} {numPages ? `of ${numPages}` : ""}
          </span>
          <button
            type="button"
            disabled={!numPages || pageNumber >= numPages}
            onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))}
            className="rounded border border-white/20 px-2 py-1 disabled:opacity-30"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
            className="rounded border border-white/20 px-2 py-1"
          >
            −
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
            className="rounded border border-white/20 px-2 py-1"
          >
            +
          </button>
          <button type="button" onClick={toggleFullscreen} className="rounded border border-white/20 px-2 py-1">
            Fullscreen
          </button>
        </div>
      </div>
    </div>
  );
}
