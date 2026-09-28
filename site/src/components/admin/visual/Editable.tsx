"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  IMAGE_ZOOM_MAX,
  IMAGE_ZOOM_MIN,
  IMAGE_ZOOM_STEP,
  imageCoverRect,
  imageFocusStyle,
  normalizeImageFocus,
  normalizeImageZoom,
  type ImageFocus,
} from "@/lib/page-document";
import { serializeRichHtml, toEditorHtml } from "@/lib/sanitize-html";
import { RichTextToolbar } from "./RichTextToolbar";

export function EText({
  value,
  onChange,
  className,
  as: Tag = "div",
  multiline = true,
  rich,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span" | "strong";
  /** Defaults to true — Enter inserts a new line; no character length limit */
  multiline?: boolean;
  /**
   * Rich formatting toolbar (font / size / color / highlight).
   * Defaults to true for all contentEditable fields.
   */
  rich?: boolean;
}) {
  const useRich = rich !== false;
  const ref = useRef<HTMLElement | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (useRich) {
      const next = toEditorHtml(value || "");
      if (el.innerHTML !== next) el.innerHTML = next;
    } else {
      const current = (el.innerText || "").replace(/\n$/, "");
      if (current !== value) el.innerText = value;
    }
  }, [value, useRich]);

  function commitFromEl(el: HTMLElement) {
    if (useRich) {
      const plain = (el.innerText || "").replace(/\u00a0/g, " ").replace(/\n$/, "");
      onChange(serializeRichHtml(el.innerHTML, plain));
    } else {
      const raw = (el.innerText || "").replace(/\u00a0/g, " ");
      onChange(raw.replace(/\n$/, ""));
    }
  }

  return (
    <>
      <Tag
        // @ts-expect-error polymorphic ref
        ref={ref}
        className={`ve-text ${useRich ? "ve-text-rich" : ""} ${className || ""}`}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={(e) => {
          if (!multiline) {
            if (e.key === "Enter") e.preventDefault();
            return;
          }
          if (e.key !== "Enter") return;
          e.preventDefault();
          if (useRich) {
            // Prefer a <br> so HTML serializes cleanly
            try {
              document.execCommand("insertLineBreak");
            } catch {
              document.execCommand("insertHTML", false, "<br>");
            }
          } else {
            document.execCommand("insertText", false, "\n");
          }
        }}
        onFocus={() => {
          setFocused(true);
          const root = ref.current?.closest("[data-section-id]");
          const id = root?.getAttribute("data-section-id");
          if (!id) return;
          window.dispatchEvent(new CustomEvent("ve-select-section", { detail: { id } }));
        }}
        onBlur={(e) => {
          // Short delay so toolbar mousedown / panel clicks keep focus/selection
          const el = e.currentTarget;
          setTimeout(() => {
            if (ref.current && document.activeElement === ref.current) return;
            if (document.activeElement?.closest?.(".ve-rich-toolbar")) return;
            setFocused(false);
            commitFromEl(el);
          }, 150);
        }}
        title={
          useRich
            ? multiline
              ? "Click to edit — select text to format; Enter for a new line"
              : "Click to edit — select text to format"
            : multiline
              ? "Click to edit — Enter for a new line"
              : "Click to edit text"
        }
        style={multiline || useRich ? { whiteSpace: "pre-wrap" } : undefined}
      />
      {useRich && focused ? (
        <RichTextToolbar
          anchor={ref.current}
          onRequestClose={() => {
            setFocused(false);
            if (ref.current) commitFromEl(ref.current);
          }}
        />
      ) : null}
    </>
  );
}

export function EImage({
  value,
  onChange,
  className,
  label = "Click to add / change photo",
  focus,
  onFocusChange,
  underChrome,
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  label?: string;
  /** Crop focus + zoom inside the frame (drag / zoom when set with onFocusChange) */
  focus?: ImageFocus;
  onFocusChange?: (next: ImageFocus) => void;
  /** Rendered after the photo / empty label (and reframe hint), before chrome — e.g. banner veil */
  underChrome?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [localFocus, setLocalFocus] = useState(() => normalizeImageFocus(focus));
  /** Natural pixel size of the loaded photo (editor reframe cover math) */
  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(null);
  /** Track which src natSize belongs to (avoid stale dims / onLoad vs effect race) */
  const [natSrc, setNatSrc] = useState<string | null>(null);
  /** Frame box size from ResizeObserver — drives explicit cover left/top */
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });
  const localFocusRef = useRef(localFocus);
  localFocusRef.current = localFocus;
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: ImageFocus;
  } | null>(null);

  const canReframe = Boolean(value && onFocusChange);
  const zoom = normalizeImageZoom(localFocus.zoom);
  const activeNat = natSize && natSrc === value ? natSize : null;

  useEffect(() => {
    if (dragging) return;
    setLocalFocus(normalizeImageFocus(focus));
  }, [focus?.x, focus?.y, focus?.zoom, dragging]);

  /*
   * A cached photo can finish loading before React attaches onLoad (SSR / fast cache),
   * so onLoad never fires and the explicit cover crop is never computed — the editor then
   * showed the top of the photo instead of the saved/live framing. Read the size directly.
   */
  useEffect(() => {
    const img = imgRef.current;
    if (!value || !img) return;
    if (img.complete && img.naturalWidth > 0) {
      setNatSrc(value);
      setNatSize({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, [value]);

  useEffect(() => {
    if (!canReframe || !value) {
      setFrameSize({ w: 0, h: 0 });
      return;
    }
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setFrameSize({ w: r.width, h: r.height });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canReframe, value]);

  async function onFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    setUploading(false);
    if (!res.ok) {
      alert("Upload failed. Try a JPG or PNG under 8MB.");
      return;
    }
    const data = await res.json();
    onChange(data.url);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function commitFocus(next: ImageFocus) {
    const normalized = normalizeImageFocus(next);
    localFocusRef.current = normalized;
    setLocalFocus(normalized);
    onFocusChange?.(normalized);
  }

  function nudgeZoom(delta: number) {
    if (!canReframe) return;
    commitFocus({
      ...localFocusRef.current,
      zoom: normalizeImageZoom(normalizeImageZoom(localFocusRef.current.zoom) + delta),
    });
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!canReframe || e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".ve-image-badge, .ve-image-badge-row, .ve-zoom-controls, .ve-image-chrome")) return;
    e.preventDefault();
    e.stopPropagation();

    /** Pan gain at 100% (no auto-zoom); a bit higher so small moves show on tall crops */
    const DRAG_GAIN = 1.75;
    const origin = normalizeImageFocus(focus ?? localFocusRef.current);
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origin,
    };
    localFocusRef.current = origin;
    setLocalFocus(origin);
    setDragging(true);
    frameRef.current?.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const state = drag.current;
      if (!state || state.pointerId !== ev.pointerId) return;
      ev.preventDefault();
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect?.width || !rect.height) return;
      const next = normalizeImageFocus({
        x: state.origin.x - ((ev.clientX - state.startX) / rect.width) * 100 * DRAG_GAIN,
        y: state.origin.y - ((ev.clientY - state.startY) / rect.height) * 100 * DRAG_GAIN,
        zoom: state.origin.zoom,
      });
      localFocusRef.current = next;
      setLocalFocus(next);
    };

    const onUp = (ev: PointerEvent) => {
      const state = drag.current;
      if (!state || state.pointerId !== ev.pointerId) return;
      drag.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      try {
        frameRef.current?.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
      setDragging(false);
      onFocusChange?.(localFocusRef.current);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  const coverRect =
    canReframe && activeNat
      ? imageCoverRect(activeNat.w, activeNat.h, frameSize.w, frameSize.h, localFocus)
      : null;

  /** Explicit cover crop for live drag preview (object-fit alone is unreliable for tall photos). */
  const reframeImgStyle: CSSProperties | undefined = coverRect
    ? {
        position: "absolute",
        maxWidth: "none",
        maxHeight: "none",
        width: coverRect.dispW,
        height: coverRect.dispH,
        left: coverRect.left,
        top: coverRect.top,
        transform: "none",
        objectFit: "fill",
        objectPosition: "50% 50%",
      }
    : undefined;

  const imgStyle: CSSProperties = reframeImgStyle ?? imageFocusStyle(localFocus);

  let reframeHint = "Drag to move";
  if (coverRect) {
    const { overflowX: ox, overflowY: oy } = coverRect;
    if (ox < 0.03 && oy < 0.03) reframeHint = "Press + to zoom, then drag";
    else if (oy >= ox) reframeHint = "Drag up/down to move";
    else reframeHint = "Drag left/right to move";
  }

  const frameStyle = {
    ["--photo-focus" as string]: `${localFocus.x}% ${localFocus.y}%`,
    ["--photo-zoom" as string]: String(zoom),
  } as CSSProperties;

  return (
    <div
      ref={frameRef}
      className={`ve-image ${canReframe ? "ve-image-reframe" : ""} ${dragging ? "is-dragging" : ""} ${className || ""}`}
      style={frameStyle}
      onPointerDown={onPointerDown}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".ve-image-badge, .ve-image-badge-row, .ve-zoom-controls, .ve-image-chrome")) return;
        if (canReframe) return;
        openPicker();
      }}
      role={canReframe ? "group" : "button"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (canReframe && (e.key === "-" || e.key === "_")) {
          e.preventDefault();
          nudgeZoom(-IMAGE_ZOOM_STEP);
          return;
        }
        if (canReframe && (e.key === "+" || e.key === "=")) {
          e.preventDefault();
          nudgeZoom(IMAGE_ZOOM_STEP);
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      aria-label={
        canReframe
          ? "Photo frame — drag to move"
          : label
      }
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={value}
          alt=""
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onLoad={(e) => {
            const img = e.currentTarget;
            setNatSrc(value);
            setNatSize({ w: img.naturalWidth, h: img.naturalHeight });
          }}
          className={reframeImgStyle ? "ve-image-reframe-abs" : undefined}
          style={imgStyle}
        />
      ) : (
        <span>{uploading ? "Uploading…" : label}</span>
      )}
      {canReframe && !dragging ? (
        <span className="ve-reframe-hint-float" aria-hidden="true">
          {reframeHint}
        </span>
      ) : null}
      {underChrome}
      <div className="ve-image-chrome">
        {canReframe ? (
          <div className="ve-zoom-controls" onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ve-zoom-btn"
              title="Zoom out"
              aria-label="Zoom out"
              disabled={zoom <= IMAGE_ZOOM_MIN}
              onClick={(e) => {
                e.stopPropagation();
                nudgeZoom(-IMAGE_ZOOM_STEP);
              }}
            >
              −
            </button>
            <span className="ve-zoom-label">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="ve-zoom-btn"
              title="Zoom in"
              aria-label="Zoom in"
              disabled={zoom >= IMAGE_ZOOM_MAX}
              onClick={(e) => {
                e.stopPropagation();
                nudgeZoom(IMAGE_ZOOM_STEP);
              }}
            >
              +
            </button>
            <button
              type="button"
              className="ve-zoom-btn ve-zoom-reset"
              title="Reset crop"
              aria-label="Reset crop"
              onClick={(e) => {
                e.stopPropagation();
                commitFocus({ x: 50, y: 50, zoom: 1 });
              }}
            >
              Reset
            </button>
          </div>
        ) : (
          <span />
        )}
        <div className="ve-image-badge-row">
          {value ? (
            <button
              type="button"
              className="ve-image-badge ve-image-badge-remove"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            >
              Remove photo
            </button>
          ) : null}
          <button
            type="button"
            className="ve-image-badge"
            onClick={(e) => {
              e.stopPropagation();
              openPicker();
            }}
          >
            {uploading ? "Uploading…" : value ? "Change photo" : "Add photo"}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
