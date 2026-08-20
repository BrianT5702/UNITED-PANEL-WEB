"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  imageFocusStyle,
  normalizeImageFocus,
  type ImageFocus,
} from "@/lib/page-document";

export function EText({
  value,
  onChange,
  className,
  as: Tag = "div",
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  as?: "div" | "h1" | "h2" | "h3" | "p" | "span" | "strong";
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.textContent !== value) el.textContent = value;
  }, [value]);

  return (
    <Tag
      // @ts-expect-error polymorphic ref
      ref={ref}
      className={`ve-text ${className || ""}`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange((e.currentTarget.textContent || "").trim())}
      title="Click to edit text"
      style={multiline ? { whiteSpace: "pre-wrap" } : undefined}
    />
  );
}

export function EImage({
  value,
  onChange,
  className,
  label = "Click to add / change photo",
  focus,
  onFocusChange,
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  label?: string;
  /** Crop focus inside the frame (drag to reframe when set with onFocusChange) */
  focus?: ImageFocus;
  onFocusChange?: (next: ImageFocus) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [localFocus, setLocalFocus] = useState(() => normalizeImageFocus(focus));
  const localFocusRef = useRef(localFocus);
  localFocusRef.current = localFocus;
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: ImageFocus;
  } | null>(null);

  const canReframe = Boolean(value && onFocusChange);

  useEffect(() => {
    if (dragging) return;
    setLocalFocus(normalizeImageFocus(focus));
  }, [focus?.x, focus?.y, dragging]);

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

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!canReframe || e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".ve-image-badge")) return;
    e.preventDefault();
    e.stopPropagation();

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
        x: state.origin.x - ((ev.clientX - state.startX) / rect.width) * 100,
        y: state.origin.y - ((ev.clientY - state.startY) / rect.height) * 100,
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

  const frameStyle = {
    ["--photo-focus" as string]: `${localFocus.x}% ${localFocus.y}%`,
  } as CSSProperties;

  return (
    <div
      ref={frameRef}
      className={`ve-image ${canReframe ? "ve-image-reframe" : ""} ${dragging ? "is-dragging" : ""} ${className || ""}`}
      style={frameStyle}
      onPointerDown={onPointerDown}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".ve-image-badge")) return;
        if (canReframe) return;
        openPicker();
      }}
      role={canReframe ? "group" : "button"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      title={canReframe ? "Drag to choose which part of the photo shows" : "Click to add / change photo"}
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={imageFocusStyle(localFocus)}
        />
      ) : (
        <span>{uploading ? "Uploading…" : label}</span>
      )}
      <div className="ve-image-chrome">
        {canReframe ? <span className="ve-reframe-hint">Drag to reframe</span> : <span />}
        <button
          type="button"
          className="ve-image-badge"
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
          }}
        >
          {uploading ? "Uploading…" : "Change photo"}
        </button>
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
