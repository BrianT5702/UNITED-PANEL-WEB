"use client";

import { findPageForHref, pagesForLinkPickers, type SitePage } from "@/lib/pages";

/** Page dropdown for admins — auto-fills the link path */
export function PageLinkField({
  value,
  onChange,
  pages: editablePages,
  label = "Opens this page",
  allowEmpty,
}: {
  value: string;
  onChange: (href: string) => void;
  pages: SitePage[];
  label?: string;
  allowEmpty?: boolean;
}) {
  const pages = pagesForLinkPickers(editablePages);
  const matched = findPageForHref(pages, value);
  const external = Boolean(value) && !matched && /^(https?:|mailto:|tel:)/i.test(value);

  return (
    <label className="ve-inline-label ve-page-link-field">
      {label}
      <select
        value={matched ? matched.path : value ? "__custom__" : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (!v || v === "__external__" || v === "__custom__") return;
          onChange(v);
        }}
      >
        {allowEmpty || (!matched && !value) ? <option value="">Choose a page…</option> : null}
        {!matched && value ? (
          <option value="__custom__">
            {external ? "External link" : "Custom link"}: {value}
          </option>
        ) : null}
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
