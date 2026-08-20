"use client";

import { useState } from "react";
import { SITE_PAGES, adminEditHref, type SitePage } from "@/lib/pages";

/** Compact page picker used by legacy editors */
export function AdminPageSwitcher({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const currentId =
    SITE_PAGES.find((p) => adminEditHref(p.id) === current)?.id ||
    (current === "/admin/edit" ? "home" : SITE_PAGES[0]?.id || "home");
  const currentPage = SITE_PAGES.find((p) => p.id === currentId);
  const groups = ["Home", "About", "Products", "Other"] as const;

  return (
    <div className={`ve-page-menu${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="ve-page-menu-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ve-page-select-label">Page</span>
        <span className="ve-page-menu-current">{currentPage?.label || currentId}</span>
      </button>
      {open ? (
        <>
          <button type="button" className="ve-page-menu-backdrop" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="ve-page-menu-panel" role="listbox">
            {groups.map((group) => {
              const pages = SITE_PAGES.filter((p: SitePage) => p.group === group);
              if (!pages.length) return null;
              return (
                <div key={group} className="ve-page-menu-group">
                  <p className="ve-page-menu-group-label">{group}</p>
                  {pages.map((page) => (
                    <a
                      key={page.id}
                      role="option"
                      aria-selected={page.id === currentId}
                      href={adminEditHref(page.id)}
                      className={page.id === currentId ? "is-active" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {page.label}
                    </a>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
