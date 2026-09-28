"use client";

import { useEffect, useRef, useState } from "react";
import { openPdf } from "@/lib/pdf-thumb-client";

type PdfDoc = Awaited<ReturnType<typeof openPdf>>;

type Props = {
  fileUrl: string;
  title: string;
  /** Fit-width multiplier. Pages grow wider than the screen so the reader can pan. */
  zoom?: number;
  onPageCount?: (count: number) => void;
};

/** One paint at a time — phones choke if every page renders together. */
let renderQueue: Promise<void> = Promise.resolve();

function enqueueRender(task: () => Promise<void>) {
  const run = renderQueue.then(task, task);
  renderQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * In-page PDF reader. Phone browsers download a PDF when you navigate to the
 * file; drawing the pages here lets a scanned QR open the document for reading.
 */
export function CataloguePdfPages({ fileUrl, title, zoom = 1, onPageCount }: Props) {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState(false);
  const onPageCountRef = useRef(onPageCount);
  onPageCountRef.current = onPageCount;

  useEffect(() => {
    let cancelled = false;
    let loadedDoc: PdfDoc | null = null;
    setDoc(null);
    setPageCount(0);
    setError(false);

    openPdf(fileUrl)
      .then((loaded) => {
        if (cancelled) {
          void loaded.destroy();
          return;
        }
        loadedDoc = loaded;
        setDoc(loaded);
        setPageCount(loaded.numPages);
        onPageCountRef.current?.(loaded.numPages);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      void loadedDoc?.destroy();
    };
  }, [fileUrl]);

  if (error) {
    return (
      <p className="cat-pdf-status" role="alert">
        This phone could not preview the file. Use Download to save it and open it from your files.
      </p>
    );
  }

  if (!doc || pageCount === 0) {
    return (
      <p className="cat-pdf-status" role="status">
        <span className="cat-view-spinner" /> Opening document…
      </p>
    );
  }

  return (
    <div className="cat-pdf-scroll">
      <div
        className="cat-pdf-pages"
        style={zoom > 1 ? { width: `${Math.round(zoom * 100)}%` } : undefined}
        aria-label={title}
      >
        {Array.from({ length: pageCount }, (_, i) => (
          <PdfPage key={`${fileUrl}-${i + 1}`} doc={doc} pageNumber={i + 1} />
        ))}
      </div>
    </div>
  );
}

function PdfPage({ doc, pageNumber }: { doc: PdfDoc; pageNumber: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(pageNumber <= 1);
  const [ratio, setRatio] = useState(1 / 1.414);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry) setActive(entry.isIntersecting);
      },
      { rootMargin: "700px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const canvas = wrap.querySelector("canvas");
    if (!active) {
      // Drop the bitmap so off-screen pages do not sit in phone memory
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      return;
    }

    let cancelled = false;
    let lastCss = 0;
    let renderTask: { cancel: () => void } | null = null;

    const paint = () =>
      enqueueRender(async () => {
        if (cancelled) return;
        const cssWidth = Math.round(wrap.clientWidth);
        if (cssWidth < 8 || Math.abs(cssWidth - lastCss) < 2) return;
        lastCss = cssWidth;

        try {
          const page = await doc.getPage(pageNumber);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          if (base.height > 0) setRatio(base.width / base.height);

          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          let scale = (cssWidth * dpr) / base.width;
          const probe = page.getViewport({ scale });
          if (probe.width > 1600) scale *= 1600 / probe.width;
          const viewport = page.getViewport({ scale });

          const surface = wrap.querySelector("canvas");
          if (!surface) return;
          surface.width = Math.ceil(viewport.width);
          surface.height = Math.ceil(viewport.height);
          const ctx = surface.getContext("2d");
          if (!ctx) return;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, surface.width, surface.height);

          try {
            renderTask?.cancel();
          } catch {
            // Previous paint already finished
          }
          const task = page.render({ canvasContext: ctx, viewport });
          renderTask = task;
          try {
            await task.promise;
          } catch {
            // Cancelled when the page scrolls away or the width changes
          }
          try {
            page.cleanup();
          } catch {
            // Optional in some pdf.js builds
          }
        } catch {
          if (!cancelled) lastCss = 0;
        }
      });

    void paint();
    const ro = new ResizeObserver(() => {
      void paint();
    });
    ro.observe(wrap);

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        // Already finished
      }
      ro.disconnect();
    };
  }, [active, doc, pageNumber]);

  return (
    <div ref={wrapRef} className="cat-pdf-page" style={{ aspectRatio: String(ratio) }}>
      <canvas aria-label={`Page ${pageNumber}`} />
    </div>
  );
}
