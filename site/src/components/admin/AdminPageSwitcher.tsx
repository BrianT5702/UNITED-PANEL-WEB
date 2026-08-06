"use client";

const PAGES = [
  { href: "/admin/edit", label: "Homepage", live: "/" },
  { href: "/admin/edit/pir", label: "PIR Panels", live: "/products/pir" },
  { href: "/admin/edit/rockwool", label: "RockWool", live: "/products/rockwool" },
  { href: "/admin/edit/pur", label: "PU Panels", live: "/products/pu" },
] as const;

export function AdminPageSwitcher({ current }: { current: string }) {
  return (
    <div className="ve-page-switch">
      <span className="ve-page-switch-label">Edit page</span>
      <div className="ve-page-switch-links">
        {PAGES.map((page) => (
          <a
            key={page.href}
            href={page.href}
            className={current === page.href ? "is-active" : undefined}
          >
            {page.label}
          </a>
        ))}
      </div>
    </div>
  );
}
