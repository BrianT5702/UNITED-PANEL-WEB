/**
 * Dual-theme color helpers for rich text.
 * Picked colors get an auto companion so text/highlights stay readable
 * when visitors switch html[data-theme="light"|"dark"].
 */

export type Rgb = { r: number; g: number; b: number };

/** Site ink references (documentation / future presets). */
export const SITE_INK_LIGHT = "#14181f";
export const SITE_INK_DARK = "#f3f5f7";

const SAFE_HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const SAFE_RGB_RE =
  /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i;

/** Parse #hex or rgb()/rgba() into 0–255 channels. */
export function parseColor(input: string): Rgb | null {
  const v = input.trim();
  const hex = SAFE_HEX_RE.exec(v);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length === 8) h = h.slice(0, 6); // drop alpha for luminance
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = SAFE_RGB_RE.exec(v);
  if (rgb) {
    return {
      r: Math.max(0, Math.min(255, Math.round(Number(rgb[1])))),
      g: Math.max(0, Math.min(255, Math.round(Number(rgb[2])))),
      b: Math.max(0, Math.min(255, Math.round(Number(rgb[3])))),
    };
  }
  return null;
}

export function toHex({ r, g, b }: Rgb): string {
  const ch = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(rgb: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const u = Math.max(0, Math.min(1, t));
  return {
    r: a.r + (b.r - a.r) * u,
    g: a.g + (b.g - a.g) * u,
    b: a.b + (b.b - a.b) * u,
  };
}

/** Binary-search mix with white/black to near a target luminance (keeps hue better). */
function towardLuminance(rgb: Rgb, targetL: number): Rgb {
  const L = relativeLuminance(rgb);
  if (Math.abs(L - targetL) < 0.02) return rgb;
  const pole: Rgb = targetL > L ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  let lo = 0;
  let hi = 1;
  let best = rgb;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    const c = mix(rgb, pole, mid);
    const Lc = relativeLuminance(c);
    best = c;
    if (targetL > L) {
      if (Lc < targetL) lo = mid;
      else hi = mid;
    } else {
      if (Lc > targetL) lo = mid;
      else hi = mid;
    }
  }
  return best;
}

/** True when value is a safe solid color we can store as --rt-* */
export function isSafeSolidColor(value: string): boolean {
  const v = value.trim();
  return SAFE_HEX_RE.test(v) || SAFE_RGB_RE.test(v);
}

/**
 * From one picked text color, return { light, dark } page companions.
 * Dark pick → light pages keep it; dark pages get a lightened tint.
 * Light pick → dark pages keep it; light pages get a darkened tint.
 */
export function companionTextColors(picked: string): { light: string; dark: string } {
  const rgb = parseColor(picked);
  if (!rgb) {
    const fallback = picked.trim() || "#14181f";
    return { light: fallback, dark: fallback };
  }
  const L = relativeLuminance(rgb);
  const hex = toHex(rgb);
  if (L < 0.45) {
    // Dark enough for light backgrounds — lighten toward ~0.55–0.65 L for dark pages
    const target = Math.min(0.68, Math.max(0.52, L + 0.4));
    return { light: hex, dark: toHex(towardLuminance(rgb, target)) };
  }
  // Light enough for dark backgrounds — darken toward ~0.15–0.25 L for light pages
  const target = Math.max(0.12, Math.min(0.28, L - 0.4));
  return { light: toHex(towardLuminance(rgb, target)), dark: hex };
}

/**
 * Highlight companions: pastel on light pages, deeper tint on dark pages.
 */
export function companionHighlightColors(picked: string): {
  light: string;
  dark: string;
} {
  const rgb = parseColor(picked);
  if (!rgb) {
    const fallback = picked.trim() || "#fff59d";
    return { light: fallback, dark: fallback };
  }
  const L = relativeLuminance(rgb);
  const hex = toHex(rgb);
  if (L >= 0.35) {
    // Pastel / bright — keep for light; deepen for dark (~0.12–0.22 L soft glow)
    const target = Math.max(0.1, Math.min(0.22, L * 0.18));
    return { light: hex, dark: toHex(towardLuminance(rgb, target)) };
  }
  // Already deep — use on dark pages; lighten toward pastel for light
  return { light: toHex(towardLuminance(rgb, 0.78)), dark: hex };
}

/** Normalize any solid to #rrggbb when possible. */
export function normalizeToHex(value: string): string | null {
  const rgb = parseColor(value);
  return rgb ? toHex(rgb) : null;
}

/** Known-good paired text presets (light page / dark page). */
export const TEXT_COLOR_PAIRS: {
  label: string;
  light: string;
  dark: string;
}[] = [
  { label: "Brand red", light: "#c41230", dark: "#ff7a8a" },
  { label: "Orange", light: "#b86a2e", dark: "#f0b27a" },
  { label: "Blue", light: "#1e4d8c", dark: "#7eb0e8" },
  { label: "Green", light: "#1a5f2a", dark: "#6bc87a" },
  { label: "Gray", light: "#5a6573", dark: "#9aa3ae" },
  { label: "Ink / White", light: "#14181f", dark: "#f3f5f7" },
];

/** Known-good highlight pairs (pastel light / deep dark). */
export const HIGHLIGHT_COLOR_PAIRS: {
  label: string;
  light: string;
  dark: string;
}[] = [
  { label: "Yellow", light: "#fff59d", dark: "#5c4d00" },
  { label: "Green", light: "#c8e6c9", dark: "#1b4332" },
  { label: "Pink", light: "#f8bbd0", dark: "#6b2940" },
  { label: "Blue", light: "#bbdefb", dark: "#1a3a5c" },
  { label: "Orange", light: "#ffe0b2", dark: "#6b3a10" },
];

/** Build inline style map for dual text color. */
export function textColorStyle(light: string, dark: string): Record<string, string> {
  const L = normalizeToHex(light) ?? light.trim();
  const D = normalizeToHex(dark) ?? dark.trim();
  return {
    "--rt-color": L,
    "--rt-color-dark": D,
    color: "var(--rt-color)",
  };
}

/** Build inline style map for dual highlight. */
export function highlightStyle(light: string, dark: string): Record<string, string> {
  const L = normalizeToHex(light) ?? light.trim();
  const D = normalizeToHex(dark) ?? dark.trim();
  return {
    "--rt-bg": L,
    "--rt-bg-dark": D,
    "background-color": "var(--rt-bg)",
  };
}

export const CLEAR_TEXT_COLOR_PROPS = [
  "color",
  "--rt-color",
  "--rt-color-dark",
];

export const CLEAR_HIGHLIGHT_PROPS = [
  "background-color",
  "--rt-bg",
  "--rt-bg-dark",
];
