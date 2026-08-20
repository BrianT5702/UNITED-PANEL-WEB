"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  persistTheme,
  resolveTheme,
  type SiteTheme,
} from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<SiteTheme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = resolveTheme();
    applyTheme(initial);
    setTheme(initial);
    setReady(true);
  }, []);

  const next: SiteTheme = theme === "dark" ? "light" : "dark";
  const label = next === "light" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      className={`theme-toggle${ready ? " is-ready" : ""}`}
      aria-label={label}
      title={label}
      onClick={() => {
        persistTheme(next);
        setTheme(next);
      }}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="4.25" />
            <path
              strokeLinecap="round"
              d="M12 3.5v1.75M12 18.75V20.5M4.93 4.93l1.24 1.24M17.83 17.83l1.24 1.24M3.5 12h1.75M18.75 12H20.5M4.93 19.07l1.24-1.24M17.83 6.17l1.24-1.24"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.2 14.1A8.2 8.2 0 0 1 9.9 3.8 7.1 7.1 0 1 0 20.2 14.1Z"
            />
          </svg>
        )}
      </span>
      <span className="theme-toggle-label">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
