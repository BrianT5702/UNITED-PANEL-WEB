"use client";

import { useEffect, useId, useState, type CSSProperties, type MouseEvent } from "react";

export type LightboxDialogProps = {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  caption?: string;
};

export function LightboxDialog({ open, onClose, src, alt, caption }: LightboxDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div className="lightbox-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="lightbox-toolbar">
          <p id={titleId}>{caption || alt}</p>
          <button
            type="button"
            className="lightbox-close"
            onClick={onClose}
            aria-label="Close enlarged image"
          >
            Close
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
      </div>
    </div>
  );
}

type LightboxImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  style?: CSSProperties;
  caption?: string;
  /** Show the "Click to enlarge" chip. Default true. */
  hint?: boolean;
  /** Stop click from bubbling (e.g. inside a parent click handler). */
  stopPropagation?: boolean;
};

export function LightboxImage({
  src,
  alt,
  className,
  imgClassName,
  style,
  caption,
  hint = true,
  stopPropagation = false,
}: LightboxImageProps) {
  const [open, setOpen] = useState(false);

  const onTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) event.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={`lightbox-trigger${className ? ` ${className}` : ""}`}
        onClick={onTriggerClick}
        aria-label={`Enlarge image: ${alt || "photo"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={imgClassName} style={style} />
        {hint ? <span className="lightbox-hint">Click to enlarge</span> : null}
      </button>

      <LightboxDialog
        open={open}
        onClose={() => setOpen(false)}
        src={src}
        alt={alt}
        caption={caption}
      />
    </>
  );
}
