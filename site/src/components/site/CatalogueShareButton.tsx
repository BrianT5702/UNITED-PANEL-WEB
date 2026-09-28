"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  id: string;
  title: string;
  /** Absolute permanent link (…/r/<id>) — what the QR code encodes */
  permanentUrl: string;
  /** Compact square icon trigger (used on the catalogue cards) */
  iconOnly?: boolean;
};

/**
 * "Share" button + accessible dialog for one catalogue / brochure.
 * Uses the native <dialog> element: focus is trapped inside, Esc closes it,
 * and clicking the dimmed backdrop or the X button also closes it.
 */
export function CatalogueShareButton({ id, title, permanentUrl, iconOnly = false }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  function show() {
    setOpen(true);
    setCopied(false);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(permanentUrl);
      setCopied(true);
    } catch {
      // Clipboard blocked (e.g. non-HTTPS) — select the text so it can be copied manually
      linkInputRef.current?.select();
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url: permanentUrl });
    } catch {
      // user cancelled — nothing to do
    }
  }

  const qrSrc = `/r/${id}/qr?size=480`;

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          className="cat-card-btn cat-card-btn-icon"
          onClick={show}
          aria-haspopup="dialog"
          aria-label={`Share ${title}`}
          title="Share / QR code"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="18" cy="5.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="18" cy="18.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={show} aria-haspopup="dialog">
          Share
        </button>
      )}
      <dialog
        ref={dialogRef}
        className="cat-share"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // Click on the backdrop lands on the <dialog> element itself
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="cat-share-inner">
          <div className="cat-share-head">
            <h2 id={titleId}>Share “{title}”</h2>
            <button type="button" className="cat-share-close" onClick={close} aria-label="Close">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <p className="cat-share-help">Scan the QR code with a phone camera, or copy the link.</p>

          <div className="cat-share-qr">
            {open ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt={`QR code for ${title}`} width={200} height={200} />
            ) : null}
          </div>

          <label className="cat-share-label" htmlFor={`${titleId}-link`}>
            Permanent link
          </label>
          <div className="cat-share-link">
            <input
              id={`${titleId}-link`}
              ref={linkInputRef}
              type="text"
              readOnly
              value={permanentUrl}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button type="button" className="btn btn-ghost" onClick={() => void copyLink()}>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
          <p className="cat-share-status" role="status" aria-live="polite">
            {copied ? "Link copied to clipboard." : ""}
          </p>

          <div className="cat-share-actions">
            <a className="btn btn-primary" href={`/r/${id}/qr?download=1`} download>
              Download QR (PNG)
            </a>
            {canNativeShare ? (
              <button type="button" className="btn btn-ghost" onClick={() => void nativeShare()}>
                Share…
              </button>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
