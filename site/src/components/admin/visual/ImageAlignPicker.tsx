"use client";

import { IMAGE_ALIGN_OPTIONS, type ImageAlignId } from "@/lib/page-document";

export function ImageAlignPicker({
  value,
  onChange,
  label = "Photo position",
}: {
  value?: ImageAlignId;
  onChange: (next: ImageAlignId) => void;
  label?: string;
}) {
  const current = value || "center";
  return (
    <div className="ve-aspect-picker ve-align-picker" title={label}>
      <span className="ve-placement-label">{label}</span>
      <div className="ve-align-grid" role="group" aria-label={label}>
        {IMAGE_ALIGN_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`ve-align-cell ${current === opt.id ? "is-active" : ""}`}
            onClick={() => onChange(opt.id)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={current === opt.id}
          />
        ))}
      </div>
      <span className="ve-align-current">{IMAGE_ALIGN_OPTIONS.find((o) => o.id === current)?.label}</span>
    </div>
  );
}
