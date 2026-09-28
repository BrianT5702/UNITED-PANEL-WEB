"use client";

/**
 * Browser-only: render page 1 of a PDF to a JPEG using pdf.js.
 * No server-native tools needed (works the same on Windows / Linux hosts).
 */

type PdfJs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJs> | null = null;

export function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      // Served by our own route (src/app/pdfjs/…) with a JavaScript MIME type;
      // the version query keeps worker and library in step.
      pdfjs.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.min.mjs?v=${pdfjs.version}`;
      return pdfjs;
    });
    pdfjsPromise.catch(() => {
      pdfjsPromise = null;
    });
  }
  return pdfjsPromise;
}

/** Open a PDF in the browser (same worker setup as thumbnails). */
export async function openPdf(url: string) {
  const pdfjs = await loadPdfJs();
  return pdfjs.getDocument({ url }).promise;
}

export async function renderPdfFirstPageJpeg(
  source: string | ArrayBuffer,
  { width = 600, quality = 0.82 }: { width?: number; quality?: number } = {},
): Promise<Blob> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument(
    typeof source === "string" ? { url: source } : { data: new Uint8Array(source) },
  );
  // Don't let a stuck worker or a huge file hang the admin page forever
  const timer = setTimeout(() => void task.destroy(), 90_000);
  const doc = await task.promise.catch((err: unknown) => {
    clearTimeout(timer);
    throw err instanceof Error ? err : new Error(String(err));
  });
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: width / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available");
    // JPEG has no transparency — paint a white page first
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) throw new Error("Could not export thumbnail");
    return blob;
  } finally {
    clearTimeout(timer);
    await doc.destroy();
  }
}
