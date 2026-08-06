"use client";

import { useEffect, useState } from "react";
import type { NavItem, SiteSettings } from "@/lib/types";

export function SiteHeader({
  settings,
  navItems,
}: {
  settings: SiteSettings;
  navItems: NavItem[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <a className="brand" href="/" aria-label={`${settings.siteName} home`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src={settings.logoUrl} alt={settings.siteName} />
      </a>
      <nav className={`nav${open ? " is-open" : ""}`} aria-label="Primary">
        {navItems.map((item) => (
          <a
            key={`${item.label}-${item.href}`}
            href={item.href}
            className={item.href === "/contact" || item.label.toLowerCase().includes("contact") ? "nav-cta" : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <button
        className="nav-toggle"
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
      </button>
    </header>
  );
}
