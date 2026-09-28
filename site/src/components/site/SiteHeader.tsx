"use client";

import { useEffect, useRef, useState } from "react";
import type { NavItem, SiteSettings } from "@/lib/types";
import { ThemeToggle } from "@/components/site/ThemeToggle";

const STAFF_CLICKS = 5;
const STAFF_CLICK_WINDOW_MS = 1200;

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
  /** Page scrolled at all → header gets a shadow (and a slightly smaller logo on live pages) */
  const [raised, setRaised] = useState(false);
  /** Current path, for the active-link underline (set after mount to avoid hydration drift) */
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const staffClicks = useRef(0);
  const staffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sync = () => {
      const overlayHero = document.querySelector("main .hero, main .about-hero");
      // Pages without a photo banner keep a solid header (same as scrolled home)
      setScrolled(!overlayHero || window.scrollY > 12);
      setRaised(window.scrollY > 8);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("has-nav-open", open);
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("has-nav-open");
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (staffTimer.current) clearTimeout(staffTimer.current);
    };
  }, []);

  useEffect(() => {
    setCurrentPath(window.location.pathname.replace(/\/+$/, "") || "/");
  }, []);

  const isCurrent = (href: string) => {
    if (!currentPath || !href.startsWith("/")) return false;
    const clean = href.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
    return clean === currentPath || (clean !== "/" && currentPath.startsWith(`${clean}/`));
  };

  const closeMenu = () => {
    setOpen(false);
    setExpanded(null);
  };

  /** One normal click → home. Five quick clicks → staff login (/admin). */
  function onBrandClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    staffClicks.current += 1;
    if (staffTimer.current) clearTimeout(staffTimer.current);

    if (staffClicks.current >= STAFF_CLICKS) {
      staffClicks.current = 0;
      window.location.assign("/admin");
      return;
    }

    staffTimer.current = setTimeout(() => {
      const count = staffClicks.current;
      staffClicks.current = 0;
      if (count > 0 && count < STAFF_CLICKS) {
        window.location.assign(brandHref);
      }
    }, STAFF_CLICK_WINDOW_MS);
  }

  return (
    <header
      className={`site-header${scrolled ? " is-scrolled" : ""}${raised ? " is-raised" : ""}${open ? " is-nav-open" : ""}`}
    >
      {open ? (
        <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={closeMenu} />
      ) : null}
      <a
        className="brand"
        href={brandHref}
        aria-label={`${settings.siteName} home`}
        onClick={onBrandClick}
        title={settings.brandTagline ? `${settings.siteName} — ${settings.brandTagline}` : settings.siteName}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src={settings.logoUrl} alt="" />
        <span className="brand-copy">
          <span className="brand-title">{settings.siteName}</span>
          {settings.brandTagline ? (
            <span className="brand-tagline">{settings.brandTagline}</span>
          ) : null}
        </span>
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
                  aria-current={isCurrent(item.href) ? "page" : undefined}
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
                  <a
                    href={item.href}
                    className="nav-link"
                    aria-current={
                      isCurrent(item.href) || item.children!.some((child) => isCurrent(child.href))
                        ? "page"
                        : undefined
                    }
                    onClick={closeMenu}
                  >
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
                      aria-current={isCurrent(child.href) ? "page" : undefined}
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
