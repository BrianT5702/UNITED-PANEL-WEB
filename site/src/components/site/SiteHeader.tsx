"use client";

import { useEffect, useState } from "react";
import type { NavItem, SiteSettings } from "@/lib/types";
import { ThemeToggle } from "@/components/site/ThemeToggle";

export function SiteHeader({
  settings,
  navItems,
  brandHref = "/",
}: {
  settings: SiteSettings;
  navItems: NavItem[];
  brandHref?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const overlayHero = document.querySelector("main .hero, main .about-hero");
      // Pages without a photo banner keep a solid header (same as scrolled home)
      setScrolled(!overlayHero || window.scrollY > 12);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  const closeMenu = () => {
    setOpen(false);
    setExpanded(null);
  };

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <a className="brand" href={brandHref} aria-label={`${settings.siteName} home`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src={settings.logoUrl} alt={settings.siteName} />
      </a>
      <div className="header-tools">
        <nav className={`nav${open ? " is-open" : ""}`} aria-label="Primary">
          {navItems.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const isExpanded = expanded === item.href;

            if (!hasChildren) {
              return (
                <a
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                </a>
              );
            }

            return (
              <div
                className={`nav-item has-dropdown${isExpanded ? " is-expanded" : ""}`}
                key={`${item.label}-${item.href}`}
              >
                <div className="nav-item-row">
                  <a href={item.href} className="nav-link" onClick={closeMenu}>
                    {item.label}
                  </a>
                  <button
                    type="button"
                    className="nav-caret"
                    aria-label={`${isExpanded ? "Hide" : "Show"} ${item.label} submenu`}
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpanded((current) => (current === item.href ? null : item.href))
                    }
                  >
                    <span />
                  </button>
                </div>
                <div className="nav-dropdown" role="menu">
                  {item.children!.map((child) => (
                    <a
                      key={`${child.label}-${child.href}`}
                      href={child.href}
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <ThemeToggle />
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
      </div>
    </header>
  );
}
