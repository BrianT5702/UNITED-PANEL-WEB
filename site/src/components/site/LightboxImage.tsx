"use client";

import { useEffect, useId, useState } from "react";

type LightboxImageProps = {
  src: string;
  alt: string;
  className?: string;
  caption?: string;
};

export function LightboxImage({ src, alt, className, caption }: LightboxImageProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`lightbox-trigger${className ? ` ${className}` : ""}`}
        onClick={() => setOpen(true)}
        aria-label={`Enlarge image: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
        <span className="lightbox-hint">Click to enlarge</span>
      </button>

      {open ? (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <div
            className="lightbox-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="lightbox-toolbar">
              <p id={titleId}>{caption || alt}</p>
              <button
                type="button"
                className="lightbox-close"
                onClick={() => setOpen(false)}
                aria-label="Close enlarged image"
              >
                Close
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} />
          </div>
        </div>
      ) : null}
    </>
  );
}
