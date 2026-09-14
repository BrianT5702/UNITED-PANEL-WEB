"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type AboutNavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const ABOUT_NAV: AboutNavItem[] = [
  { label: "Company Profile", href: "/about/company-profile" },
  { label: "Vision & Mission", href: "/about/vision-mission" },
  { label: "Research & Development", href: "/about/research-development" },
  {
    label: "Certified, Recognized and Approved",
    href: "/about/certified",
    children: [
      { label: "FM Global Approval", href: "/about/certified/fm-global" },
      { label: "TÜV Fire Classification", href: "/about/certified/tuv" },
      { label: "ISO, SIRIM & Bomba", href: "/about/certified/quality-recognition" },
    ],
  },
];

function currentLabel(activeHref: string) {
  for (const item of ABOUT_NAV) {
    const child = item.children?.find((c) => c.href === activeHref);
    if (child) return child.label;
    if (
      activeHref === item.href ||
      (item.href !== "/about" && activeHref.startsWith(`${item.href}/`))
    ) {
      return item.label;
    }
  }
  return "About Us";
}

export function AboutSideNav({
  activeHref,
  mapHref,
}: {
  activeHref: string;
  mapHref?: (href: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const href = (h: string) => (mapHref ? mapHref(h) : h);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <aside className={`about-side${open ? " is-open" : ""}`} aria-label="About sections">
      <button
        type="button"
        className="about-side-fab"
        aria-expanded={open}
        aria-controls="about-side-panel"
        onClick={() => setOpen(true)}
      >
        About
      </button>
      {open ? (
        <button
          type="button"
          className="about-side-backdrop"
          aria-label="Close About menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="about-side-panel" id="about-side-panel">
        <div className="about-side-panel-head">
          <p className="about-side-title about-side-heading">About Us</p>
          <button
            type="button"
            className="about-side-close"
            aria-label="Close About menu"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
        <p className="about-side-now">
          Now viewing <strong>{currentLabel(activeHref)}</strong>
        </p>
        <ul className="about-side-nav">
          {ABOUT_NAV.map((item) => {
            const active =
              activeHref === item.href ||
              item.children?.some((c) => c.href === activeHref) ||
              (item.href !== "/about" && activeHref.startsWith(`${item.href}/`));
            return (
              <li key={item.href} className={active ? "is-active" : undefined}>
                <Link href={href(item.href)} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
                {item.children ? (
                  <ul>
                    {item.children.map((child) => (
                      <li
                        key={child.href}
                        className={activeHref === child.href ? "is-active" : undefined}
                      >
                        <Link href={href(child.href)} onClick={() => setOpen(false)}>
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
