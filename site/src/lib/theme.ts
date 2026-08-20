/** Public site theme preference */

export const THEME_STORAGE_KEY = "up-theme";

export type SiteTheme = "light" | "dark";

export function isSiteTheme(value: unknown): value is SiteTheme {
  return value === "light" || value === "dark";
}

export function themeFromSystem(): SiteTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function readStoredTheme(): SiteTheme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isSiteTheme(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function resolveTheme(): SiteTheme {
  return readStoredTheme() ?? themeFromSystem();
}

export function applyTheme(theme: SiteTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function persistTheme(theme: SiteTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
  applyTheme(theme);
}

/** Inline boot script — keeps first paint from flashing the wrong theme */
export const THEME_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute("data-theme","dark");document.documentElement.style.colorScheme="dark";}})();`;
