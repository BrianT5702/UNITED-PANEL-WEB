"use client";

import {
  IMAGE_ASPECT_OPTIONS,
  type ImageAspectId,
} from "@/lib/page-document";

export function ImageAspectPicker({
  value,
  onChange,
  label = "Photo shape",
}: {
  value?: ImageAspectId;
  onChange: (next: ImageAspectId | undefined) => void;
  label?: string;
}) {
  return (
    <div className="ve-aspect-picker" title={label}>
      <span className="ve-placement-label">{label}</span>
      <div className="ve-aspect-options">
        <button
          type="button"
          className={`ve-aspect-opt ${!value ? "is-active" : ""}`}
          onClick={() => onChange(undefined)}
          title="Use the default page shape"
        >
          <span className="ve-aspect-shape-wrap">
            <span className="ve-aspect-shape" style={{ aspectRatio: "2 / 1" }} />
          </span>
          <span className="ve-aspect-opt-text">
            <span className="ve-aspect-name">Default</span>
            <span className="ve-aspect-ratio">auto</span>
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
              <span className="ve-aspect-shape" style={{ aspectRatio: opt.css }} />
            </span>
            <span className="ve-aspect-opt-text">
              <span className="ve-aspect-name">{opt.label}</span>
              <span className="ve-aspect-ratio">{opt.ratio}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
