"use client";

import {
  DEFAULT_SLIDESHOW_INTERVAL_SEC,
  normalizeSlideshowIntervalSec,
} from "@/lib/page-document";

const PRESETS = [2, 3, 4.5, 6, 8, 10] as const;

export function SlideshowIntervalControl({
  value,
  onChange,
}: {
  value?: number;
  onChange: (sec: number) => void;
}) {
  const current = normalizeSlideshowIntervalSec(value ?? DEFAULT_SLIDESHOW_INTERVAL_SEC);

  return (
    <div className="ve-tool-group ve-placement-bar ve-slideshow-interval" title="How long each photo stays">
      <span className="ve-placement-label">Slide time</span>
      {PRESETS.map((sec) => (
        <button
          key={sec}
          type="button"
          className={`ve-tool-btn ${current === sec ? "is-active" : ""}`}
          onClick={() => onChange(sec)}
        >
          {sec}s
        </button>
      ))}
      <label className="ve-interval-custom">
        <span className="ve-sr-only">Custom seconds</span>
        <input
          type="number"
          min={1}
          max={60}
          step={0.5}
          value={current}
          onChange={(e) => onChange(normalizeSlideshowIntervalSec(Number(e.target.value)))}
          aria-label="Seconds per slide"
        />
        <span>sec</span>
      </label>
    </div>
  );
}
