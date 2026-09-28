"use client";

import { normalizeVeilStrength } from "@/lib/page-document";

export function VeilStrengthControl({
  value,
  onChange,
  tone = "dark",
}: {
  value?: number;
  onChange: (next: number) => void;
  /** dark = on hero footer; light = light toolbars */
  tone?: "dark" | "light";
}) {
  const current = normalizeVeilStrength(value);

  return (
    <div className={`ve-veil-strength${tone === "light" ? " is-light" : ""}`}>
      <span className="ve-veil-strength-label">How dark is the banner photo</span>
      <div className="ve-veil-strength-row">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={current}
          aria-label="Banner darkening"
          onChange={(e) => onChange(normalizeVeilStrength(Number(e.target.value)))}
        />
        <span className="ve-veil-strength-value">{current}%</span>
      </div>
    </div>
  );
}
