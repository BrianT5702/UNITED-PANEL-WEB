"use client";

import type { SitePage } from "@/lib/pages";

/** Page dropdown for admins — auto-fills the link path */
export function PageLinkField({
  value,
  onChange,
  pages,
  label = "Opens this page",
  allowEmpty,
}: {
  value: string;
  onChange: (href: string) => void;
  pages: SitePage[];
  label?: string;
  allowEmpty?: boolean;
}) {
  const matched = pages.find((p) => p.path === value);
  const external = Boolean(value) && !matched && /^(https?:|mailto:|tel:)/i.test(value);

  return (
    <label className="ve-inline-label ve-page-link-field">
      {label}
      <select
        value={matched ? matched.path : external ? "__external__" : value && !matched ? "__custom__" : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (!v || v === "__external__" || v === "__custom__") return;
          onChange(v);
        }}
      >
        {allowEmpty || !matched ? <option value="">Choose a page…</option> : null}
        {pages.map((p) => (
          <option key={p.id} value={p.path}>
            {p.group}: {p.label}
          </option>
        ))}
      </select>
      {matched ? (
        <span className="ve-page-link-hint">Goes to {matched.path}</span>
      ) : value ? (
        <span className="ve-page-link-hint">Current link: {value}</span>
      ) : null}
    </label>
  );
}
