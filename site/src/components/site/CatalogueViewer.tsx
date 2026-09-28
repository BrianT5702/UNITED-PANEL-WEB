"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LightboxImage } from "./LightboxImage";
import { CataloguePdfPages } from "./CataloguePdfPages";

type Props = {
  title: string;
  fileUrl: string;
  fileName: string;
  isPdf: boolean;
  /** First-page preview (PDFs): placeholder while loading, and the mobile cover */
  thumbUrl: string | null;
};

type Mode = "pending" | "embed" | "pages";

/**
 * Phones and browsers without a built-in PDF viewer draw the file in the page.
 * Linking straight to the PDF makes those browsers download it.
 */
function prefersInlinePages(): boolean {
  if (typeof window === "undefined") return true;
  const narrow = window.matchMedia("(max-width: 720px)").matches;
  const ua = navigator.userAgent;
  const mobileUa =
    /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(ua) ||
    // iPadOS reports itself as a Mac
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const nav = navigator as Navigator & { pdfViewerEnabled?: boolean };
  const noPdfViewer = nav.pdfViewerEnabled === false;
  return narrow || mobileUa || noPdfViewer;
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICON_EXTERNAL = "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5";
const ICON_FULL = "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5";
const ICON_EXIT_FULL = "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5";

export function CatalogueViewer({ title, fileUrl, fileName, isPdf, thumbUrl }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("pending");
  const [loaded, setLoaded] = useState(false);
  const [thumbOk, setThumbOk] = useState(Boolean(thumbUrl));
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const onPageCount = useCallback((count: number) => setPageCount(count), []);

  // Decide after mount (needs the browser) and follow window resizes
  useEffect(() => {
    if (!isPdf) return;
    const mq = window.matchMedia("(max-width: 720px)");
    const update = () => setMode(prefersInlinePages() ? "pages" : "embed");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [isPdf]);

  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    const onChange = () => setIsFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await frameRef.current?.requestFullscreen();
    } catch {
      // Fullscreen refused (e.g. iframe policy) — Open in new tab still works
    }
  }, []);

  if (!isPdf) {
    return (
      <div className="cat-view-card cat-view-card-image">
        <LightboxImage
          src={fileUrl}
          alt={title}
          caption={title}
          className="cat-view-image"
          hint
        />
      </div>
    );
  }

  const pdfSrc = `${fileUrl}#view=FitH&toolbar=1&navpanes=0`;

  return (
    <div
      ref={frameRef}
      className={`cat-view-card cat-view-pdf is-${mode}${isFullscreen ? " is-fullscreen" : ""}`}
    >
      <div className="cat-view-bar">
        <span className="cat-view-bar-name" title={fileName}>
          {fileName}
        </span>
        <div className="cat-view-bar-actions">
          {mode === "pages" ? (
            <div className="cat-view-zoom" role="group" aria-label="Zoom">
              <button
                type="button"
                className="cat-view-bar-btn"
                onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100))}
                disabled={zoom <= 1}
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                className="cat-view-bar-btn"
                onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.25) * 100) / 100))}
                disabled={zoom >= 2.5}
                aria-label="Zoom in"
              >
                +
              </button>
              {pageCount > 0 ? (
                <span className="cat-view-bar-pages">
                  {pageCount} {pageCount === 1 ? "page" : "pages"}
                </span>
              ) : null}
            </div>
          ) : null}
          {mode === "embed" && canFullscreen ? (
            <button type="button" className="cat-view-bar-btn" onClick={() => void toggleFullscreen()}>
              <Icon d={isFullscreen ? ICON_EXIT_FULL : ICON_FULL} />
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </button>
          ) : null}
          {mode === "embed" ? (
            <a className="cat-view-bar-btn" href={fileUrl} target="_blank" rel="noreferrer">
              <Icon d={ICON_EXTERNAL} />
              Open in new tab
            </a>
          ) : null}
        </div>
      </div>

      {mode === "pages" ? (
        <CataloguePdfPages fileUrl={fileUrl} title={title} zoom={zoom} onPageCount={onPageCount} />
      ) : (
        // "pending" (server render / before hydration): placeholder only, never an empty iframe
        <div className="cat-view-stage">
          {!loaded ? (
            <div className="cat-view-placeholder" aria-hidden>
              {thumbUrl && thumbOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl} alt="" onError={() => setThumbOk(false)} />
              ) : null}
              <span className="cat-view-loading">
                <span className="cat-view-spinner" /> Loading document…
              </span>
            </div>
          ) : null}
          {mode === "embed" ? (
            <iframe
              title={title}
              src={pdfSrc}
              className={`cat-view-frame${loaded ? " is-loaded" : ""}`}
              onLoad={() => setLoaded(true)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
