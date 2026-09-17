"use client";

import {
  IMAGE_ASPECT_OPTIONS,
  type ImageAspectId,
} from "@/lib/page-document";

const PREVIEW_BOX = 28;

/** Fit a ratio inside a square so Wide/Landscape/Square/Tall all look different */
function previewBoxStyle(css: string): { width: number; height: number } {
  const [wRaw, hRaw] = css.split("/");
  const w = Number(wRaw) || 1;
  const h = Number(hRaw) || 1;
  const scale = Math.min(PREVIEW_BOX / w, PREVIEW_BOX / h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

export function ImageAspectPicker({
  value,
  onChange,
  label = "Photo shape",
  compact = false,
}: {
  value?: ImageAspectId;
  onChange: (next: ImageAspectId | undefined) => void;
  label?: string;
  /** Smaller inline control for toolbars */
  compact?: boolean;
}) {
  return (
    <div className={`ve-aspect-picker${compact ? " is-compact" : ""}`} title={label}>
      <span className="ve-placement-label">{label}</span>
      <div className="ve-aspect-options" role="group" aria-label={label}>
        <button
          type="button"
          className={`ve-aspect-opt ${!value ? "is-active" : ""}`}
          onClick={() => onChange(undefined)}
          title="Use the default page shape"
        >
          <span className="ve-aspect-shape-wrap">
            <span className="ve-aspect-shape" style={previewBoxStyle("2 / 1")} />
          </span>
          <span className="ve-aspect-opt-text">
            <span className="ve-aspect-name">Auto</span>
            {!compact ? <span className="ve-aspect-ratio">default</span> : null}
          </span>
        </button>
        {IMAGE_ASPECT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`ve-aspect-opt ${value === opt.id ? "is-active" : ""}`}
            onClick={() => onChange(opt.id)}
            title={`${opt.hint} (${opt.ratio})`}
          >
            <span className="ve-aspect-shape-wrap">
              <span className="ve-aspect-shape" style={previewBoxStyle(opt.css)} />
            </span>
            <span className="ve-aspect-opt-text">
              <span className="ve-aspect-name">{opt.label}</span>
              {!compact ? <span className="ve-aspect-ratio">{opt.ratio}</span> : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
